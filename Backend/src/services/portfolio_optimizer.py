def optimize_portfolio(assets: list[str], returns: list[float]):
    if len(assets) != len(returns):
        raise ValueError("Assets and returns length mismatch")

    total = sum(returns)
    if total == 0:
        return [1 / len(assets)] * len(assets)

    return [r / total for r in returns]
