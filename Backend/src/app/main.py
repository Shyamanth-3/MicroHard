from fastapi import FastAPI
from .routes import router
from .config import config
from .logger import logger
from fastapi import Request
from .exceptions import (
    AppException,
    app_exception_handler,
    generic_exception_handler,
)



app = FastAPI(title=config["app"]["name"])

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

@app.on_event("startup")
async def startup_event():
    logger.info(" Backend started successfully")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"➡️ Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"⬅️ Response: {response.status_code} {request.url.path}")
    return response


app.include_router(router)

@app.get("/health")
def health_check():
    return {"status": "ok"}