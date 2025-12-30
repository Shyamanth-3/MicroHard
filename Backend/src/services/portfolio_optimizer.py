import numpy as np
from scipy.optimize import minimize


def optimize_portfolio(assets: list[str], returns: list[float]):
    returns = np.array(returns)

    if len(assets) != len(returns):
        from ..app.exceptions import AppException
        raise AppException("Assets and returns length mismatch", status_code=400)


    n = len(returns)

    # Start with equal weights
    initial_weights = np.ones(n) / n

    # Objective: maximize return → minimize negative return
    def objective(weights):
        return -np.dot(weights, returns)

    # Constraint: weights sum to 1
    constraints = ({"type": "eq", "fun": lambda w: np.sum(w) - 1})

    # Bounds: 0 ≤ weight ≤ 1  (no short selling)
    bounds = tuple((0, 1) for _ in range(n))

    result = minimize(objective, initial_weights, bounds=bounds, constraints=constraints)

    if not result.success:
        raise AppException("Portfolio optimization failed", status_code=500)
        raise AppException("Portfolio optimization failed", status_code=500)
    return result.x.tolist()
