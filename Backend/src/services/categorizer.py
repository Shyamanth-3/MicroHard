def categorize(description: str | None, merchant: str | None):
    text = ((description or "") + " " + (merchant or "")).lower()

    rules = {
        "food": ["dmart", "zomato", "swiggy", "grocery", "restaurant"],
        "transport": ["uber", "ola", "fuel", "petrol"],
        "shopping": ["amazon", "flipkart", "myntra"],
        "utilities": ["electricity", "water", "gas", "bill"],
        "subscription": ["netflix", "spotify", "prime"],
        "salary": ["salary", "payout", "credit"],
        "rent": ["rent"],
        "health": ["pharmacy", "hospital", "clinic"],
    }

    for cat, words in rules.items():
        if any(w in text for w in words):
            return cat

    return "other"
