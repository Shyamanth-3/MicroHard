from sklearn.linear_model import LinearRegression
import numpy as np


def linear_forecast(values: list[float], steps: int):
    if len(values) < 2:
        return values[-1:] * steps if values else []

    X = np.arange(len(values)).reshape(-1, 1)
    y = np.array(values)

    model = LinearRegression()
    model.fit(X, y)

    future_X = np.arange(len(values), len(values) + steps).reshape(-1, 1)
    preds = model.predict(future_X)

    return preds.tolist()
