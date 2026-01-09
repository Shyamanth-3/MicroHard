import numpy as np
from scipy.optimize import minimize


def optimize_portfolio(
    assets: list[str],
    returns: list[float],
    risk_aversion: float = 1.0
):
    returns = np.array(returns)
    n = len(returns)

    if n == 0:
        raise ValueError("Empty asset list")

    # -----------------------------
    # POLICY BOUNDS (THIS IS KEY)
    # -----------------------------
    policy_bounds = {
        "US_Stocks": (0.40, 0.50),
        "Crypto": (0.20, 0.30),
        "Bonds": (0.10, 0.15),
        "Gold": (0.10, 0.15),
        "Real_Estate": (0.05, 0.10),
        "Cash": (0.05, 0.10),
        "Intl_Stocks": (0.0, 0.05),  # allow near-zero
    }

    bounds = []
    for asset, r in zip(assets, returns):
        if r < 0:
            bounds.append((0.0, 0.0))  # hard stop on negative assets
        else:
            bounds.append(policy_bounds.get(asset, (0.05, 0.30)))

    # -----------------------------
    # COVARIANCE (REALISTIC)
    # -----------------------------
    vol = np.maximum(0.10, np.abs(returns) * 6.0)
    cov = np.outer(vol, vol) * 0.4
    np.fill_diagonal(cov, vol ** 2)

    # -----------------------------
    # OBJECTIVE
    # -----------------------------
    def objective(w):
        ret = np.dot(w, returns)
        risk = np.dot(w, np.dot(cov, w))
        return -(ret - risk_aversion * risk)

    # -----------------------------
    # CONSTRAINTS
    # -----------------------------
    constraints = [
        {"type": "eq", "fun": lambda w: np.sum(w) - 1}
    ]

    w0 = np.ones(n) / n

    result = minimize(
        objective,
        w0,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints
    )

    if not result.success:
        raise RuntimeError("Optimization failed")

    return result.x.tolist()
