from fastapi import FastAPI
from .routes import router
from .config import settings, config_yaml
from .logger import logger
from fastapi import Request
from .exceptions import (
    AppException,
    app_exception_handler,
    generic_exception_handler,
)

from .database import init_db
from ..models.transaction import Transaction


app = FastAPI(title=config_yaml["app"]["name"])

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # during development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
from pydantic import BaseModel

class AIRequest(BaseModel):
    question: str

@app.post("/api/ask-ai")
async def ask_ai(req: AIRequest):
    return {
    "success": True,
    "analysis": f"Route reached. You asked: {req.question}"
    }





app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Backend started successfully")

@app.on_event("startup")
async def startup_event():
    logger.info(" Backend started successfully")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f" Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f" Response: {response.status_code} {request.url.path}")
    return response



@app.get("/health")
def health_check():
    return {"status": "ok"}


