from ..models.forecasting import linear_forecast
from ..models.monte_carlo import monte_carlo_sim


def run_forecast_pipeline(values: list[float], steps: int):
    return linear_forecast(values, steps)


def run_monte_carlo_pipeline(initial: float, mean: float, std: float, steps: int):
    return monte_carlo_sim(initial, mean, std, steps)
