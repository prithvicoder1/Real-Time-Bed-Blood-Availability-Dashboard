"""Predict one or more hours of occupancy from the trained local model."""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "occupancy_model.pkl"


def load_artifact() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Model is not trained. Run `python3 ml/train.py` first.")
    return joblib.load(MODEL_PATH)


def normalise_input(data: dict, when: datetime) -> dict:
    current = float(data.get("current_occupancy", 0))
    if not 0 <= current <= 100:
        raise ValueError("current_occupancy must be a number between 0 and 100")
    return {
        "current_occupancy": current,
        "hour": int(data.get("hour", when.hour)) % 24,
        "day_of_week": int(data.get("day_of_week", when.weekday())) % 7,
        "temperature": float(data.get("temperature", 30)),
        "is_holiday": int(bool(data.get("is_holiday", False))),
        "facility_type": str(data.get("facility_type", "Unknown")),
    }


def forecast(data: dict, steps: int = 7) -> dict:
    artifact = load_artifact()
    model = artifact["model"]
    features = artifact["features"]
    metrics = artifact.get("metrics", {})
    now = datetime.now()
    row = normalise_input(data, now)
    values = []

    for _ in range(steps):
        prediction = float(model.predict(pd.DataFrame([row], columns=features))[0])
        occupancy = round(max(0, min(100, prediction)))
        values.append(occupancy)
        row["current_occupancy"] = occupancy
        row["hour"] = (row["hour"] + 2) % 24
        if row["hour"] < 2:
            row["day_of_week"] = (row["day_of_week"] + 1) % 7

    return {"occupancy_trend": values, "metrics": metrics}


if __name__ == "__main__":
    try:
        payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        if not isinstance(payload, dict):
            raise ValueError("Input must be a JSON object")
        print(json.dumps(forecast(payload)))
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)
