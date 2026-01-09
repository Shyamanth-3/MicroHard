import numpy as np


def run_monte_carlo_pipeline(
    initial,
    monthly,
    mean,
    std,
    years,
    paths=100,
    goal_target=None,
    early_setback=False,
):
    """
    Vectorized Monte-Carlo simulation with optional goal tracking
    and early market setback simulation.
    """

    steps = years * 12

    mean_month = mean / 12
    std_month = std / np.sqrt(12)

    simulations = np.empty((paths, steps + 1), dtype=float)
    simulations[:, 0] = initial

    for t in range(1, steps + 1):
        shocks = np.random.normal(loc=mean_month, scale=std_month, size=paths)

        # optional early setback (first year drop)
        if early_setback and t <= 12:
            shocks -= 0.15   # ~15% drop year 1

        simulations[:, t] = simulations[:, t - 1] * np.exp(shocks) + monthly

    worst = np.percentile(simulations, 5, axis=0)
    median = np.percentile(simulations, 50, axis=0)
    best = np.percentile(simulations, 95, axis=0)

    prob_reaching_goal = None
    if goal_target is not None:
        prob_reaching_goal = float((simulations[:, -1] >= goal_target).mean())

    return {
        "worst": worst.tolist(),
        "median": median.tolist(),
        "best": best.tolist(),
        "goal_probability": prob_reaching_goal,
    }
