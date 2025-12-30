from src.models.forecasting import linear_forecast


def test_linear_forecast_basic():
    values = [1, 2, 3, 4]
    result = linear_forecast(values, steps=2)

    assert len(result) == 2
    # Increasing trend → forecast should be greater than last value
    assert result[0] >= values[-1]
