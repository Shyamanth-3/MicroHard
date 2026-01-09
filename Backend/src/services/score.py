from sqlmodel import Session, select
from ..models.transaction import Transaction
import pandas as pd
import math


# ---- helpers ----
def safe_number(x: float) -> float:
    """Convert NaN/inf/None safely to 0.0"""
    try:
        if x is None or math.isnan(x) or math.isinf(x):
            return 0.0
        return float(x)
    except Exception:
        return 0.0


def get_df(session: Session):
    rows = session.exec(select(Transaction)).all()
    if not rows:
        return pd.DataFrame()

    return pd.DataFrame([r.model_dump() for r in rows])


def financial_confidence_score(session: Session):
    df = get_df(session)

    if df.empty:
        return {"score": 0, "label": "unknown", "reasons": ["No data yet"]}

    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M")

    # Monthly totals
    monthly = df.groupby("month")["amount"].sum()

    income = safe_number(df[df["amount"] > 0]["amount"].sum())
    expenses = safe_number(-df[df["amount"] < 0]["amount"].sum())

    # savings rate
    savings_rate = safe_number((income - expenses) / max(income, 1))

    # volatility
    volatility = safe_number(df["amount"].std())

    # crude buffer estimate = total balance / avg expenses
    avg_expense = safe_number(expenses / max(len(monthly), 1))
    cash_buffer_months = safe_number((income - expenses) / max(avg_expense, 1))

    # debt proxy = negative transactions with debt keywords
    debt_like = df[df["description"].fillna("").str.contains("loan|emi|credit", case=False)]
    debt_ratio = safe_number(abs(debt_like["amount"].sum()) / max(income, 1))

    score = 50
    reasons = []

    # savings
    if savings_rate > 0.25:
        score += 20
        reasons.append("Healthy savings rate")
    elif savings_rate > 0.1:
        score += 10
        reasons.append("Positive but modest savings")
    else:
        score -= 10
        reasons.append("Low or negative savings")

    # volatility
    if volatility > expenses * 0.5:
        score -= 10
        reasons.append("High spending volatility")

    # buffer
    if cash_buffer_months >= 6:
        score += 15
        reasons.append("Strong emergency buffer")
    elif cash_buffer_months >= 3:
        score += 5
        reasons.append("Some emergency buffer")
    else:
        score -= 5
        reasons.append("Limited emergency buffer")

    # debt
    if debt_ratio > 0.4:
        score -= 15
        reasons.append("High reliance on debt")
    elif debt_ratio > 0.2:
        score -= 5
        reasons.append("Moderate debt usage")

    score = max(0, min(100, score))

    label = (
        "safe" if score >= 70
        else "tight" if score >= 40
        else "fragile"
    )

    return {
        "score": score,
        "label": label,
        "reasons": reasons,
        "inputs_used": {
            "savings_rate": round(safe_number(savings_rate), 3),
            "volatility": round(safe_number(volatility), 2),
            "cash_buffer_months": round(safe_number(cash_buffer_months), 2),
            "debt_ratio": round(safe_number(debt_ratio), 3)
        }
    }
