from fastapi import APIRouter
from pydantic import BaseModel

from .config import config
from .logger import logger

from ..pipelines.predict_pipeline import (
    run_forecast_pipeline,
    run_monte_carlo_pipeline,
)
from ..services.portfolio_optimizer import optimize_portfolio

from fastapi import UploadFile, File

import pandas as pd
from io import StringIO
from pathlib import Path
import os


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
    monthly: float
    mean: float      # e.g., 0.09 (9%)
    std: float       # e.g., 0.18 (18%)
    years: int
    paths: int | None = None


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
    )
    return result



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


import pandas as pd
from io import StringIO


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()

    # Convert bytes → CSV dataframe
    # Save uploaded file to data/raw folder
    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    save_path = raw_dir / file.filename
    with open(save_path, "wb") as f:
        f.write(content)

    # Read into dataframe for metadata
    df = pd.read_csv(StringIO(content.decode()))

    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "sample": df.head(3).to_dict(orient="records"),
        "saved_path": str(save_path)
    }


@router.get("/uploads")
def list_uploads():
    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for p in sorted(raw_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.is_file():
            files.append({"filename": p.name, "path": str(p), "modified": p.stat().st_mtime})
    return {"files": files}


@router.get("/uploads/{filename}/columns")
def upload_columns(filename: str):
    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    file_path = raw_dir / filename
    if not file_path.exists():
        return {"error": "file not found"}
    df = pd.read_csv(file_path)
    return {"columns": list(df.columns), "rows": len(df)}


@router.get("/uploads/{filename}/column")
def upload_column_values(filename: str, name: str):
    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    file_path = raw_dir / filename
    if not file_path.exists():
        return {"error": "file not found"}
    df = pd.read_csv(file_path)
    if name not in df.columns:
        return {"error": "column not found"}
    vals = df[name].dropna().tolist()
    # Try converting to numeric where possible
    cleaned = []
    for v in vals:
        try:
            num = float(v)
            cleaned.append(num)
        except Exception:
            # skip non-numeric
            pass
    return {"values": cleaned}
