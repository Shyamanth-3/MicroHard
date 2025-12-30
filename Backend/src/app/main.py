from fastapi import FastAPI
from .routes import router
from .config import config

app = FastAPI(title=config["app"]["name"])

app.include_router(router)

@app.get("/health")
def health_check():
    return {"status": "ok"}