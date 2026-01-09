from fastapi import APIRouter, UploadFile, File, Depends
from pydantic import BaseModel
from pathlib import Path
from io import StringIO
import pandas as pd

from .config import config_yaml
from .logger import logger

from ..pipelines.predict_pipeline import (
    run_forecast_pipeline,
    run_monte_carlo_pipeline,
)

from ..services.portfolio_optimizer import optimize_portfolio
from ..services.portfolio_service import save_portfolio, get_portfolios
from ..services.ingestion import normalize_and_save
from ..services.analytics import (
    totals_by_category,
    income_expense_over_time,
    volatility,
)
from ..services.score import financial_confidence_score

from ..models.transaction import Transaction
from .database import get_session


# ---------------- ROOT ROUTER ----------------
router = APIRouter(prefix="/api", tags=["API"])


# ------------- FORECAST ----------------------
class ForecastRequest(BaseModel):
    values: list[float]
    steps: int | None = None


@router.post("/forecast")
def forecast_endpoint(req: ForecastRequest):
    steps = req.steps or config_yaml["forecasting"]["default_steps"]
    logger.info(f"[FORECAST] values={req.values} steps={steps}")
    result = run_forecast_pipeline(req.values, steps)
    return {"forecast": result}


# ------------- MONTE CARLO -------------------
class MonteCarloRequest(BaseModel):
    initial: float
    monthly: float
    mean: float
    std: float
    years: int
    paths: int | None = None
    goal_target: float | None = None
    early_setback: bool = False


@router.post("/monte-carlo")
def monte_carlo_endpoint(req: MonteCarloRequest):
    used_paths = req.paths or 100

    result = run_monte_carlo_pipeline(
        req.initial,
        req.monthly,
        req.mean,
        req.std,
        req.years,
        paths=used_paths,
        goal_target=req.goal_target,
        early_setback=req.early_setback,
    )

    return result


# ------------- OPTIMIZER ---------------------
class OptimizeRequest(BaseModel):
    assets: list[str]
    returns: list[float]


@router.post("/optimize")
def optimize_endpoint(req: OptimizeRequest):
    logger.info(f"[OPTIMIZE] assets={req.assets}")
    result = optimize_portfolio(req.assets, req.returns)
    return {"weights": result}


# ------------- HEALTH ------------------------
@router.get("/")
def home():
    return {"message": "Backend is running"}


# ------------- PORTFOLIOS --------------------
class SavePortfolioRequest(BaseModel):
    name: str
    assets: list[str]
    returns: list[float]


@router.post("/save-portfolio")
def save_portfolio_endpoint(req: SavePortfolioRequest):
    weights = optimize_portfolio(req.assets, req.returns)
    portfolio = save_portfolio(req.name, req.assets, weights)
    return {"id": portfolio.id, "weights": weights}


@router.get("/portfolios")
def list_portfolios():
    return get_portfolios()


# ------------- FILE UPLOAD (DB INGESTION) ---
@router.post("/upload")
async def upload_file(file: UploadFile = File(...), session=Depends(get_session)):
    content = await file.read()

    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    save_path = raw_dir / file.filename
    with open(save_path, "wb") as f:
        f.write(content)

    df = pd.read_csv(StringIO(content.decode()))

    imported = normalize_and_save(df, session)

    return {
        "filename": file.filename,
        "rows": len(df),
        "imported": imported,
        "columns": list(df.columns),
        "saved_path": str(save_path),
    }


# ------------- TRANSACTIONS ------------------
class TransactionIn(BaseModel):
    date: str
    amount: float
    category: str | None = None
    merchant: str | None = None
    type: str | None = None
    account: str | None = None
    description: str | None = None
    raw_json: dict | None = None


@router.post("/transactions")
def add_transaction(req: TransactionIn, session=Depends(get_session)):
    tx = Transaction(
        **req.model_dump(exclude={"raw_json"}),
        raw_json=(None if req.raw_json is None else str(req.raw_json)),
    )
    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx


# ------------- ANALYTICS ---------------------
@router.get("/analytics/categories")
def api_totals_by_category(session=Depends(get_session)):
    return totals_by_category(session)


@router.get("/analytics/cashflow")
def api_cashflow(session=Depends(get_session)):
    return income_expense_over_time(session)


@router.get("/analytics/volatility")
def api_volatility(session=Depends(get_session)):
    return {"volatility": volatility(session)}


# ------------- SCORE ------------------------
@router.get("/score")
def api_score(session=Depends(get_session)):
    return financial_confidence_score(session)
