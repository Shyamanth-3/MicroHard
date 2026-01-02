from ..models.forecasting import linear_forecast
from ..models.monte_carlo import run_monte_carlo_pipeline as monte_carlo_model

from ..app.logger import logger

def run_forecast_pipeline(values: list[float], steps: int):
    logger.info("Running forecast pipeline")
    return linear_forecast(values, steps)


def run_monte_carlo_pipeline(initial: float, monthly: float, mean: float, std: float, years: int, paths: int = 100):
    logger.info("Running Monte Carlo pipeline")
    return monte_carlo_model(initial, monthly, mean, std, years, paths)


