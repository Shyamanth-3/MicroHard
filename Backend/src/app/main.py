import os
from fastapi import FastAPI
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


# --------------------------------------------------
# App Initialization
# --------------------------------------------------

app = FastAPI(title=config_yaml["app"]["name"])


# --------------------------------------------------
# CORS CONFIG — SINGLE SOURCE OF TRUTH ✅
# --------------------------------------------------
# DO NOT add manual headers
# DO NOT add OPTIONS handlers
# DO NOT add custom CORS middleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hospitable-balance-production-15ad.up.railway.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=False,   # MUST be False unless using cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Groq AI Client
# --------------------------------------------------

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
                {
                    "role": "system",
                    "content": "You are FinSight AI, a financial analysis assistant."
                },
                {
                    "role": "user",
                    "content": req.question
                }
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


# --------------------------------------------------
# Exception Handlers
# --------------------------------------------------

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# --------------------------------------------------
# Startup
# --------------------------------------------------

@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Backend started successfully")


# --------------------------------------------------
# Routes
# --------------------------------------------------

app.include_router(router)


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "ok"}
