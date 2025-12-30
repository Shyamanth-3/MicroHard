from ..models.forecasting import linear_forecast
from ..models.monte_carlo import monte_carlo_sim
from ..app.logger import logger

def run_forecast_pipeline(values: list[float], steps: int):
    logger.info("Running forecast pipeline")
    return linear_forecast(values, steps)


def run_monte_carlo_pipeline(initial: float, mean: float, std: float, steps: int):
    logger.info("Running Monte Carlo pipeline")
    return monte_carlo_sim(initial, mean, std, steps)


