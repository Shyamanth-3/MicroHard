from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from .logger import logger


class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def app_exception_handler(request: Request, exc: AppException):
    logger.error(f"[APP ERROR] {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message},
    )


async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"[UNEXPECTED ERROR] {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Something went wrong. Please try again later."},
    )
