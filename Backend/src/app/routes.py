from fastapi import APIRouter
from pydantic import BaseModel
from .config import config


from ..pipelines.predict_pipeline import (
    run_forecast_pipeline,
    run_monte_carlo_pipeline,
)
from ..services.portfolio_optimizer import optimize_portfolio


router = APIRouter()


class ForecastRequest(BaseModel):
    values: list[float]
    steps: int


@router.post("/forecast")
def forecast_endpoint(req: ForecastRequest):
    steps = req.steps or config["forecasting"]["default_steps"]
    return {"forecast": run_forecast_pipeline(req.values, steps)}


class MonteCarloRequest(BaseModel):
    initial: float
    mean: float
    std: float
    steps: int


@router.post("/monte-carlo")
def monte_carlo_endpoint(req: MonteCarloRequest):
    return {"simulation": run_monte_carlo_pipeline(req.initial, req.mean, req.std, req.steps)}


class OptimizeRequest(BaseModel):
    assets: list[str]
    returns: list[float]


@router.post("/optimize")
def optimize_endpoint(req: OptimizeRequest):
    return {"weights": optimize_portfolio(req.assets, req.returns)}


@router.get("/")
def home():
    return {"message": "Backend is running"}
