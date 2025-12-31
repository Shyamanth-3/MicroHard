import json
from sqlmodel import Session, select
from ..models.portfolio_model import Portfolio
from ..app.database import engine

def save_portfolio(name: str, assets: list[str], weights: list[float]):
    portfolio = Portfolio(
        name=name,
        assets=json.dumps(assets),
        weights=json.dumps(weights)
    )
    with Session(engine) as session:
        session.add(portfolio)
        session.commit()
        session.refresh(portfolio)
        return portfolio


def get_portfolios():
    with Session(engine) as session:
        statement = select(Portfolio)
        results = session.exec(statement).all()
        return results
