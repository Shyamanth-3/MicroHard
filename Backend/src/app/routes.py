from fastapi import APIRouter
from pydantic import BaseModel

from .config import config
from .logger import logger

from ..pipelines.predict_pipeline import (
    run_forecast_pipeline,
    run_monte_carlo_pipeline,
)
from ..services.portfolio_optimizer import optimize_portfolio


# All routes will now appear under /api/*
router = APIRouter(prefix="/api", tags=["API"])


# -------- FORECAST --------
class ForecastRequest(BaseModel):
    values: list[float]
    steps: int | None = None


@router.post("/forecast", tags=["Forecasting"])
def forecast_endpoint(req: ForecastRequest):
    steps = req.steps or config["forecasting"]["default_steps"]

    logger.info(f"[FORECAST] values={req.values} steps={steps}")

    result = run_forecast_pipeline(req.values, steps)
    return {"forecast": result}


# -------- MONTE CARLO --------
class MonteCarloRequest(BaseModel):
    initial: float
    mean: float
    std: float
    steps: int


@router.post("/monte-carlo", tags=["Simulation"])
def monte_carlo_endpoint(req: MonteCarloRequest):
    logger.info(f"[MONTE-CARLO] {req}")
    result = run_monte_carlo_pipeline(req.initial, req.mean, req.std, req.steps)
    return {"simulation": result}


# -------- OPTIMIZER --------
class OptimizeRequest(BaseModel):
    assets: list[str]
    returns: list[float]


@router.post("/optimize", tags=["Portfolio"])
def optimize_endpoint(req: OptimizeRequest):
    logger.info(f"[OPTIMIZE] assets={req.assets}")
    result = optimize_portfolio(req.assets, req.returns)
    return {"weights": result}


# -------- HOME --------
@router.get("/", tags=["Health"])
def home():
    return {"message": "Backend is running"}

from ..services.portfolio_service import save_portfolio, get_portfolios


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
