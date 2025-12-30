from fastapi.testclient import TestClient
from src.app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200


def test_forecast_endpoint():
    payload = {"values": [10, 12, 14], "steps": 2}
    res = client.post("/api/forecast", json=payload)

    assert res.status_code == 200
    assert "forecast" in res.json()


def test_optimize_endpoint():
    payload = {
        "assets": ["AAPL", "TSLA"],
        "returns": [0.2, 0.1]
    }
    res = client.post("/api/optimize", json=payload)

    assert res.status_code == 200
    assert "weights" in res.json()
