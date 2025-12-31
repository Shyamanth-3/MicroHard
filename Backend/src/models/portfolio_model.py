from sqlmodel import SQLModel, Field
from typing import Optional

class Portfolio(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    assets: str
    weights: str
