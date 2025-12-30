
from src.services.portfolio_optimizer import optimize_portfolio


def test_optimize_weights_sum_to_one():
    weights = optimize_portfolio(
        assets=["A", "B", "C"],
        returns=[0.1, 0.2, 0.15]
    )

    assert round(sum(weights), 5) == 1
    assert all(0 <= w <= 1 for w in weights)
