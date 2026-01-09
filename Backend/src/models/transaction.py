from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date


class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    date: date
    amount: float
    category: Optional[str] = None
    merchant: Optional[str] = None
    type: Optional[str] = None   # income/expense/transfer
    account: Optional[str] = None
    description: Optional[str] = None

    raw_json: Optional[str] = None   # encrypted later
