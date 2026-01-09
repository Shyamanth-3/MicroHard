from sqlmodel import select, Session
from ..models.transaction import Transaction
from ..services.portfolio_service import get_portfolios
from ..services.ingestion import detect_column_types  # reuse detection logic
import pandas as pd
from pathlib import Path
import json


def fetch_df(session: Session):
    rows = session.exec(select(Transaction)).all()
    if not rows:
        return pd.DataFrame()

    data = [r.model_dump() for r in rows]
    return pd.DataFrame(data)


def totals_by_category(session: Session):
    df = fetch_df(session)
    if df.empty:
        return []

    grouped = (
        df.groupby("category")["amount"]
        .sum()
        .reset_index()
        .rename(columns={"amount": "total"})
    )
    
    return grouped.to_dict(orient="records")


def income_expense_over_time(session: Session):
    df = fetch_df(session)
    if df.empty:
        return []

    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M").astype(str)

    # Separate income and expenses
    df["income"] = df["amount"].apply(lambda x: x if x > 0 else 0)
    df["expenses"] = df["amount"].apply(lambda x: abs(x) if x < 0 else 0)

    grouped = (
        df.groupby("month")[["income", "expenses"]]
        .sum()
        .reset_index()
    )

    return grouped.to_dict(orient="records")


def volatility(session: Session):
    df = fetch_df(session)
    if df.empty:
        return None

    return float(df["amount"].std())


def net_worth_timeseries(session: Session, initial_portfolio_value: float = 100000.0):
    """
    Combine portfolio returns (from latest uploaded portfolio CSV)
    with monthly net cashflow from transactions to produce a net-worth series.
    """
    # 1) Load transactions cashflow (income/expenses by month)
    cash = income_expense_over_time(session)
    cash_by_month = {row["month"]: float(row.get("income", 0) - row.get("expenses", 0)) for row in cash}

    # 2) Locate latest portfolio returns CSV in data/raw
    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    portfolio_df = None
    if raw_dir.exists():
        candidates = sorted(list(raw_dir.glob("*.csv")), key=lambda p: p.stat().st_mtime, reverse=True)
        for f in candidates:
            try:
                df = pd.read_csv(f)
                detected = detect_column_types(df)
                cols_lower = [c.lower() for c in df.columns]
                has_date = any("date" in c for c in cols_lower)
                has_amount = ("amount" in detected) or any(c in ["amount", "value", "debit", "credit", "transaction amount"] for c in cols_lower)
                if has_date and not has_amount and len(df.columns) >= 3:
                    portfolio_df = df.copy()
                    break
            except Exception:
                continue

    # If no portfolio file, build dates just from cashflow
    if portfolio_df is None:
        months_sorted = sorted(cash_by_month.keys())
        pv = []
        savings = []
        networth = []
        pv_val = initial_portfolio_value
        sav = 0.0
        for m in months_sorted:
            # no return info → assume 0% monthly return
            pv_val = pv_val
            sav += cash_by_month.get(m, 0.0)
            pv.append(round(pv_val, 2))
            savings.append(round(sav, 2))
            networth.append(round(pv_val + sav, 2))
        return {"months": months_sorted, "portfolio_value": pv, "net_savings": savings, "net_worth": networth}

    # 3) Prepare portfolio monthly returns
    dfp = portfolio_df.copy()
    # normalize date column name
    date_col = None
    for c in dfp.columns:
        if str(c).strip().lower().startswith("date"):
            date_col = c
            break
    dfp["date"] = pd.to_datetime(dfp[date_col])
    dfp["month"] = dfp["date"].dt.to_period("M").astype(str)
    # numeric return columns
    ret_cols = [c for c in dfp.columns if c not in [date_col, "date", "month"]]

    # 4) Determine weights: latest saved portfolio or equal-weight
    weights_map = {}
    try:
        portfolios = get_portfolios()
        if portfolios:
            last = portfolios[-1]
            assets = json.loads(last.assets)
            weights = json.loads(last.weights)
            weights_map = {a: float(w) for a, w in zip(assets, weights)}
    except Exception:
        weights_map = {}

    if not weights_map:
        # equal weights across available columns
        w = 1.0 / max(1, len(ret_cols))
        weights_map = {c: w for c in ret_cols}

    # align weights to columns present
    weights_series = []
    for c in ret_cols:
        weights_series.append(weights_map.get(c, 0.0))
    total_w = sum(weights_series)
    if total_w <= 0:
        w = 1.0 / max(1, len(ret_cols))
        weights_series = [w for _ in ret_cols]
        total_w = 1.0
    # normalize
    weights_series = [w / total_w for w in weights_series]

    # compute weighted monthly return
    dfp["portfolio_return"] = (dfp[ret_cols] * weights_series).sum(axis=1)
    # keep month and return
    returns_by_month = {row["month"]: float(row["portfolio_return"]) for _, row in dfp[["month", "portfolio_return"]].iterrows()}

    # 5) Merge months and compute series
    months_sorted = sorted(set(list(returns_by_month.keys()) + list(cash_by_month.keys())))
    pv = []
    savings = []
    networth = []
    pv_val = initial_portfolio_value
    sav = 0.0
    prev_month = None
    for m in months_sorted:
        r = returns_by_month.get(m, 0.0)
        pv_val = pv_val * (1.0 + r)
        sav += cash_by_month.get(m, 0.0)
        pv.append(round(pv_val, 2))
        savings.append(round(sav, 2))
        networth.append(round(pv_val + sav, 2))

    return {"months": months_sorted, "portfolio_value": pv, "net_savings": savings, "net_worth": networth}
