import random


def monte_carlo_sim(initial: float, mean: float, std: float, steps: int):
    results = [initial]
    value = initial

    for _ in range(steps):
        change = random.gauss(mean, std)
        value += change
        results.append(value)

    return results
