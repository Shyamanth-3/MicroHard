import pandas as pd
import random
from datetime import datetime, timedelta

random.seed(42)

rows = []
start_date = datetime(2022, 1, 1)

categories = {
    "Salary": "income",
    "Freelance": "income",
    "Rent": "expense",
    "Groceries": "expense",
    "Dining": "expense",
    "Fuel": "expense",
    "Shopping": "expense",
    "Electricity": "expense",
    "Internet": "expense",
    "Insurance": "expense",
    "Medical": "expense",
    "Travel": "expense",
    "Mutual Fund": "expense",
    "Stocks": "expense"
}

descriptions = {
    "Salary": "Monthly Salary Credit",
    "Freelance": "Freelance Project Payment",
    "Rent": "House Rent",
    "Groceries": "Supermarket Purchase",
    "Dining": "Restaurant Payment",
    "Fuel": "Fuel Station",
    "Shopping": "Online Shopping",
    "Electricity": "Electricity Bill",
    "Internet": "Broadband Bill",
    "Insurance": "Insurance Premium",
    "Medical": "Medical Expense",
    "Travel": "Travel Booking",
    "Mutual Fund": "SIP Investment",
    "Stocks": "Equity Purchase"
}

for i in range(20000):
    date = start_date + timedelta(days=random.randint(0, 900))
    category = random.choice(list(categories.keys()))
    txn_type = categories[category]

    if category == "Salary":
        amount = random.randint(60000, 90000)
    elif category in ["Mutual Fund", "Stocks"]:
        amount = random.randint(3000, 15000)
    elif category == "Rent":
        amount = random.randint(15000, 25000)
    else:
        amount = random.randint(200, 8000)

    rows.append({
        "date": date.strftime("%Y-%m-%d"),
        "description": descriptions[category],
        "category": category,
        "amount": amount,
        "type": txn_type,
        "account": random.choice(["HDFC Savings", "ICICI Savings"]),
        "payment_method": random.choice(["UPI", "Card", "NetBanking"])
    })

df = pd.DataFrame(rows)
df.to_csv("impressive_finance_dataset.csv", index=False)

print("Dataset generated: impressive_finance_dataset.csv")
