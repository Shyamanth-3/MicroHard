from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
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
from ..services.ingestion import normalize_and_save, detect_column_types
from ..services.analytics import (
    totals_by_category,
    income_expense_over_time,
    volatility,
    net_worth_timeseries,
)
from ..services.score import financial_confidence_score
from ..services.auth import authenticate, create_access_token, get_current_user

from ..models.transaction import Transaction
from .database import get_session


# ---------------- ROOT ROUTER ----------------
router = APIRouter(prefix="/api", tags=["API"])

# ------------- AUTH -------------------------
class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/auth/login")
def auth_login(req: LoginRequest):
    user = authenticate(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["email"]) 
    return {"access_token": token, "token_type": "bearer", "user": user}


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
def optimize_endpoint(req: OptimizeRequest, user: dict = Depends(get_current_user)):
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
def save_portfolio_endpoint(req: SavePortfolioRequest, user: dict = Depends(get_current_user)):
    weights = optimize_portfolio(req.assets, req.returns)
    portfolio = save_portfolio(req.name, req.assets, weights)
    return {"id": portfolio.id, "weights": weights}


@router.get("/portfolios")
def list_portfolios(user: dict = Depends(get_current_user)):
    return get_portfolios()


# ------------- UPLOADS LIST ---
@router.get("/uploads")
def list_uploads():
    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    if not raw_dir.exists():
        return {"files": []}
    
    files = []
    for f in raw_dir.glob("*.csv"):
        files.append({
            "filename": f.name,
            "size": f.stat().st_size,
            "modified": f.stat().st_mtime
        })
    
    return {"files": files}


# ------------- GET UPLOADED FILE COLUMNS ---
@router.get("/uploads/{filename}/columns")
def get_file_columns(filename: str):
    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    file_path = raw_dir / filename
    
    if not file_path.exists():
        return {"error": "File not found", "columns": [], "rows": 0}
    
    try:
        df = pd.read_csv(file_path)
        return {
            "columns": list(df.columns),
            "rows": len(df)
        }
    except Exception as e:
        return {"error": str(e), "columns": [], "rows": 0}


# ------------- GET TRANSACTIONS ---
@router.get("/transactions")
def get_transactions(session=Depends(get_session), user: dict = Depends(get_current_user)):
    """Get all transactions from database"""
    try:
        transactions = session.query(Transaction).all()
        result = []
        for tx in transactions:
            result.append({
                "id": tx.id,
                "date": tx.date.isoformat() if tx.date else None,
                "amount": tx.amount,
                "description": tx.description,
                "category": tx.category,
                "type": tx.type,
                "merchant": tx.merchant,
                "account": tx.account,
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        return {"error": str(e)}


# ------------- GET COLUMN VALUES ---
@router.get("/uploads/{filename}/column")
def get_column_values(filename: str, name: str):
    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    file_path = raw_dir / filename
    
    if not file_path.exists():
        return {"error": "File not found", "values": []}
    
    try:
        df = pd.read_csv(file_path)
        if name not in df.columns:
            return {"error": "Column not found", "values": []}
        
        # Return values based on column dtype: numeric columns -> floats; others -> raw strings
        col = df[name].dropna()
        if pd.api.types.is_numeric_dtype(col):
            numeric_values = [float(v) for v in col.tolist()]
            return {"values": numeric_values}
        else:
            raw_values = [str(v) for v in col.tolist()]
            return {"values": raw_values}
    except Exception as e:
        return {"error": str(e), "values": []}


# ------------- FILE UPLOAD (DB INGESTION) ---
@router.post("/upload")
async def upload_file(file: UploadFile = File(...), session=Depends(get_session), user: dict = Depends(get_current_user)):
    content = await file.read()

    raw_dir = Path(__file__).resolve().parents[3] / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    save_path = raw_dir / file.filename
    with open(save_path, "wb") as f:
        f.write(content)

    df = pd.read_csv(StringIO(content.decode()))

    # Detect column types
    detected_fields = detect_column_types(df)
    
    # Check if this is a portfolio returns file (date + multiple numeric columns, no amount)
    columns_lower = [c.lower() for c in df.columns]
    has_date = any('date' in c for c in columns_lower)
    has_amount = any(c in ['amount', 'value', 'debit', 'credit', 'transaction amount'] for c in columns_lower)
    
    # If has date but no amount column, treat as portfolio returns file
    is_portfolio_file = has_date and not has_amount and len(df.columns) >= 3
    
    imported = 0
    file_type = "portfolio" if is_portfolio_file else "transactions"
    
    if not is_portfolio_file:
        # Only import to database if it's transaction data
        try:
            imported = normalize_and_save(df, session)
        except ValueError as e:
            # If it fails, might be portfolio data after all
            file_type = "portfolio"
            logger.warning(f"File doesn't match transaction format: {e}")

    # Return sample data for frontend processing
    sample = df.head(10).to_dict('records') if len(df) > 0 else []

    return {
        "filename": file.filename,
        "rows": len(df),
        "imported": imported,
        "columns": list(df.columns),
        "detected_fields": detected_fields,
        "saved_path": str(save_path),
        "file_type": file_type,
        "sample": sample
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
def add_transaction(req: TransactionIn, session=Depends(get_session), user: dict = Depends(get_current_user)):
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
def api_totals_by_category(session=Depends(get_session), user: dict = Depends(get_current_user)):
    return totals_by_category(session)


@router.get("/analytics/cashflow")
def api_cashflow(session=Depends(get_session), user: dict = Depends(get_current_user)):
    return income_expense_over_time(session)


@router.get("/analytics/volatility")
def api_volatility(session=Depends(get_session), user: dict = Depends(get_current_user)):
    return {"volatility": volatility(session)}


@router.get("/analytics/networth")
def api_networth(initial: float = 100000.0, session=Depends(get_session), user: dict = Depends(get_current_user)):
    return net_worth_timeseries(session, initial)


# ------------- SCORE ------------------------
@router.get("/score")
def api_score(session=Depends(get_session), user: dict = Depends(get_current_user)):
    return financial_confidence_score(session)
