
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

from .routes import router
from .config import config_yaml
from .logger import logger
from .exceptions import (
    AppException,
    app_exception_handler,
    generic_exception_handler,
)
from .database import init_db


app = FastAPI(title=config_yaml["app"]["name"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


class AIRequest(BaseModel):
    question: str


@app.post("/api/ask-ai")
async def ask_ai(req: AIRequest):
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are FinSight AI, a financial analysis assistant."},
                {"role": "user", "content": req.question}
            ],
            temperature=0.7,
        )


        return {
            "success": True,
            "analysis": completion.choices[0].message.content
        }

    except Exception:
        logger.exception("Groq AI error")
        return {
            "success": False,
            "error": "AI service is temporarily unavailable."
        }


app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Backend started successfully")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code} {request.url.path}")
    return response


app.include_router(router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
