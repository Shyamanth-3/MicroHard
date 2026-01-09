from sqlmodel import select, Session
from ..models.transaction import Transaction
import pandas as pd


def fetch_df(session: Session):
    rows = session.exec(select(Transaction)).all()
    if not rows:
        return pd.DataFrame()

    data = [r.model_dump() for r in rows]
    return pd.DataFrame(data)


def totals_by_category(session: Session):
    df = fetch_df(session)
    if df.empty:
        return {}

    return (
        df.groupby("category")["amount"]
        .sum()
        .sort_values()
        .to_dict()
    )


def income_expense_over_time(session: Session):
    df = fetch_df(session)
    if df.empty:
        return []

    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M")

    grouped = (
        df.groupby("month")["amount"]
        .sum()
        .reset_index()
    )

    return grouped.assign(month=grouped["month"].astype(str)).to_dict(orient="records")


def volatility(session: Session):
    df = fetch_df(session)
    if df.empty:
        return None

    return float(df["amount"].std())
