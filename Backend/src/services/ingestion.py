import pandas as pd
from datetime import datetime
from sqlmodel import Session
from ..models.transaction import Transaction
from .categorizer import categorize


POSSIBLE_DATE_COLUMNS = ["date", "transaction_date", "posted", "time"]
POSSIBLE_AMOUNT_COLUMNS = ["amount", "value", "debit", "credit"]
POSSIBLE_DESC_COLUMNS = ["description", "details", "memo"]
POSSIBLE_MERCHANT_COLUMNS = ["merchant", "payee", "vendor"]


def find_first(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    return None


def normalize_and_save(df: pd.DataFrame, session: Session):
    df = df.copy()

    # normalize headers
    df.columns = [c.strip().lower() for c in df.columns]

    date_col = find_first(df, POSSIBLE_DATE_COLUMNS)
    amount_col = find_first(df, POSSIBLE_AMOUNT_COLUMNS)

    if not date_col or not amount_col:
        raise ValueError("CSV must contain date and amount-like columns")

    desc_col = find_first(df, POSSIBLE_DESC_COLUMNS)
    merchant_col = find_first(df, POSSIBLE_MERCHANT_COLUMNS)

    saved = 0

    for _, row in df.iterrows():
        try:
            description = row[desc_col] if desc_col else None
            merchant = row[merchant_col] if merchant_col else None

            tx = Transaction(
                date=pd.to_datetime(row[date_col]).date(),
                amount=float(row[amount_col]),
                description=description,
                merchant=merchant,
                category=categorize(description, merchant),
                raw_json=row.to_json(),   # (we’ll encrypt this later)
            )

            session.add(tx)
            saved += 1

        except Exception:
            # Skip bad rows instead of crashing ingestion (MVP-friendly)
            continue

    session.commit()
    return saved
