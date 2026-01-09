import numpy as np
import pandas as pd


def generate_portfolio_dataset_20000(
    rows=20_000,
    start_date="2005-01-01",
    freq="D",  # Daily data
    seed=42,
    save_csv=True
):
    np.random.seed(seed)

    assets = [
        "US_Stocks",
        "Intl_Stocks",
        "Bonds",
        "Gold",
        "Crypto",
        "Real_Estate",
        "Cash"
    ]

    # Expected ANNUAL returns (realistic)
    annual_returns = np.array([
        0.10,   # US Stocks
        0.07,   # Intl Stocks
        0.04,   # Bonds
        0.05,   # Gold
        0.18,   # Crypto
        0.07,   # Real Estate
        0.02    # Cash
    ])

    # Expected ANNUAL volatility
    annual_volatility = np.array([
        0.18,  # US Stocks
        0.20,  # Intl Stocks
        0.06,  # Bonds
        0.12,  # Gold
        0.40,  # Crypto
        0.15,  # Real Estate
        0.01   # Cash
    ])

    # Correlation matrix (diversified & realistic)
    correlation = np.array([
        [1.0, 0.75, 0.20, 0.25, 0.60, 0.70, 0.05],
        [0.75, 1.0, 0.20, 0.25, 0.55, 0.65, 0.05],
        [0.20, 0.20, 1.0, 0.10, 0.05, 0.20, 0.10],
        [0.25, 0.25, 0.10, 1.0, 0.20, 0.30, 0.10],
        [0.60, 0.55, 0.05, 0.20, 1.0, 0.50, 0.05],
        [0.70, 0.65, 0.20, 0.30, 0.50, 1.0, 0.05],
        [0.05, 0.05, 0.10, 0.10, 0.05, 0.05, 1.0],
    ])

    # Convert annual → daily (252 trading days)
    mean_returns = annual_returns / 252
    vol_returns = annual_volatility / np.sqrt(252)

    cov_matrix = np.outer(vol_returns, vol_returns) * correlation

    # Generate correlated daily returns
    data = np.random.multivariate_normal(
        mean_returns,
        cov_matrix,
        size=rows
    )

    df = pd.DataFrame(data, columns=assets)

    # Add date column
    df.insert(
        0,
        "date",
        pd.date_range(start=start_date, periods=rows, freq=freq)
    )

    if save_csv:
        df.to_csv("portfolio_returns_20000_with_dates.csv", index=False)

    return df


if __name__ == "__main__":
    df = generate_portfolio_dataset_20000()
    print(df.head())
    print("Rows:", len(df))
    print("Start:", df["date"].min(), "End:", df["date"].max())
