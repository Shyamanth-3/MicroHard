import numpy as np


def run_monte_carlo_pipeline(initial, monthly, mean, std, years, paths=100):
    """Vectorized Monte Carlo simulation (monthly steps).

    Uses NumPy to simulate `paths` in parallel. Default `paths` lowered
    to 100 for fast MVP runs; increase if you need more precision.
    """
    steps = years * 12

    mean_month = mean / 12
    std_month = std / np.sqrt(12)

    # Pre-allocate array: shape (paths, steps + 1)
    simulations = np.empty((paths, steps + 1), dtype=float)
    simulations[:, 0] = initial

    # Vectorized monthly updates across all paths
    for t in range(1, steps + 1):
        shocks = np.random.normal(loc=mean_month, scale=std_month, size=paths)
        simulations[:, t] = simulations[:, t - 1] * np.exp(shocks) + monthly

    # Percentiles across paths
    worst = np.percentile(simulations, 5, axis=0)
    median = np.percentile(simulations, 50, axis=0)
    best = np.percentile(simulations, 95, axis=0)

    return {
        "paths": None,  # omit full paths by default to keep responses small
        "worst": worst.tolist(),
        "median": median.tolist(),
        "best": best.tolist(),
    }
