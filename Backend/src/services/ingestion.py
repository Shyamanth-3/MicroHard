import pandas as pd
from datetime import datetime
from sqlmodel import Session
from ..models.transaction import Transaction
from .categorizer import categorize


POSSIBLE_DATE_COLUMNS = ["date", "transaction_date", "posted", "time", "transaction date"]
POSSIBLE_AMOUNT_COLUMNS = ["amount", "value", "debit", "credit", "transaction amount"]
POSSIBLE_DESC_COLUMNS = ["description", "details", "memo", "narration"]
POSSIBLE_MERCHANT_COLUMNS = ["merchant", "payee", "vendor"]
POSSIBLE_CATEGORY_COLUMNS = ["category", "tag"]
POSSIBLE_TYPE_COLUMNS = ["type", "transaction_type", "debit_credit"]
POSSIBLE_ACCOUNT_COLUMNS = ["account", "bank", "account_name"]


def detect_column_types(df: pd.DataFrame):
    '''
    Auto-detect what each column might represent
    Returns a dict with detected column purposes
    '''
    df_lower = df.copy()
    df_lower.columns = [c.strip().lower() for c in df_lower.columns]
    
    detected = {
        "date": find_first(df_lower, POSSIBLE_DATE_COLUMNS),
        "amount": find_first(df_lower, POSSIBLE_AMOUNT_COLUMNS),
        "description": find_first(df_lower, POSSIBLE_DESC_COLUMNS),
        "merchant": find_first(df_lower, POSSIBLE_MERCHANT_COLUMNS),
        "category": find_first(df_lower, POSSIBLE_CATEGORY_COLUMNS),
        "type": find_first(df_lower, POSSIBLE_TYPE_COLUMNS),
        "account": find_first(df_lower, POSSIBLE_ACCOUNT_COLUMNS),
    }
    
    return {k: v for k, v in detected.items() if v is not None}


def find_first(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    return None


def normalize_and_save(df: pd.DataFrame, session: Session, column_mapping: dict = None):
    '''
    Normalize CSV and save to database
    column_mapping: Optional dict to specify which columns map to which fields
    '''
    df = df.copy()

    # normalize headers
    df.columns = [c.strip().lower() for c in df.columns]

    # Use provided mapping or auto-detect
    if column_mapping:
        date_col = column_mapping.get("date")
        amount_col = column_mapping.get("amount")
        desc_col = column_mapping.get("description")
        merchant_col = column_mapping.get("merchant")
        category_col = column_mapping.get("category")
        type_col = column_mapping.get("type")
        account_col = column_mapping.get("account")
    else:
        date_col = find_first(df, POSSIBLE_DATE_COLUMNS)
        amount_col = find_first(df, POSSIBLE_AMOUNT_COLUMNS)
        desc_col = find_first(df, POSSIBLE_DESC_COLUMNS)
        merchant_col = find_first(df, POSSIBLE_MERCHANT_COLUMNS)
        category_col = find_first(df, POSSIBLE_CATEGORY_COLUMNS)
        type_col = find_first(df, POSSIBLE_TYPE_COLUMNS)
        account_col = find_first(df, POSSIBLE_ACCOUNT_COLUMNS)

    if not date_col or not amount_col:
        raise ValueError("CSV must contain date and amount-like columns")

    saved = 0

    for _, row in df.iterrows():
        try:
            description = row[desc_col] if desc_col and desc_col in row else None
            merchant = row[merchant_col] if merchant_col and merchant_col in row else None
            category = row[category_col] if category_col and category_col in row else None
            tx_type = row[type_col] if type_col and type_col in row else None
            account = row[account_col] if account_col and account_col in row else None
            
            # If no category provided, use categorizer
            if not category:
                category = categorize(description, merchant)
            
            # Determine amount sign based on type
            amount = float(row[amount_col])
            if tx_type and str(tx_type).lower() == "expense" and amount > 0:
                amount = -amount
            elif tx_type and str(tx_type).lower() == "income" and amount < 0:
                amount = abs(amount)

            tx = Transaction(
                date=pd.to_datetime(row[date_col]).date(),
                amount=amount,
                description=description,
                merchant=merchant,
                category=category,
                type=tx_type,
                account=account,
                raw_json=row.to_json(),
            )

            session.add(tx)
            saved += 1

        except Exception as e:
            # Skip bad rows instead of crashing ingestion (MVP-friendly)
            print(f"Skipping row: {e}")
            continue

    session.commit()
    return saved
