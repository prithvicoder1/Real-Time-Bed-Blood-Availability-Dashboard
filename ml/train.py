"""Reproducible CareBridge bed-occupancy forecasting pipeline.

By default this creates a privacy-safe simulated operational dataset calibrated
to plausible Indian hospital workflows. It is a software demonstration, not a
clinical model. Pass --data to train on an authorised de-identified time series.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT = Path(__file__).resolve().parent
SOURCES_PATH = ROOT / "data_sources.json"
MODEL_PATH = ROOT / "occupancy_model.pkl"
JOBLIB_PATH = ROOT / "occupancy_model.joblib"
METRICS_PATH = ROOT / "model_metrics.json"
FEATURE_COLUMNS = ["current_occupancy", "hour", "day_of_week", "temperature", "is_holiday", "facility_type"]


def generate_simulated_data(hospitals: int = 40, days: int = 120, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    times = pd.date_range("2025-01-01", periods=days * 24, freq="h")
    rows = []
    types = ["Government", "Private", "Teaching"]
    for hospital in range(hospitals):
        facility_type = types[hospital % len(types)]
        capacity = int(rng.integers(80, 850))
        baseline = rng.uniform(.48, .82)
        phase = rng.uniform(-1.5, 1.5)
        occupancy = baseline
        for timestamp in times:
            hour = timestamp.hour
            weekend = timestamp.dayofweek >= 5
            holiday = int(rng.random() < .025)
            temperature = 26 + 7 * np.sin((timestamp.dayofyear - 70) * 2 * np.pi / 365) + rng.normal(0, 1.8)
            demand = .015 * np.sin((hour - 9 + phase) * np.pi / 12) + (.012 if 9 <= hour <= 19 else -.008)
            demand += (.008 if weekend else 0) + (.018 if holiday else 0) + rng.normal(0, .012)
            occupancy = float(np.clip(.91 * occupancy + .09 * baseline + demand, .12, .99))
            rows.append({"timestamp": timestamp, "hospital_id": f"H{hospital:03d}", "facility_type": facility_type,
                         "total_beds": capacity, "occupied_beds": round(capacity * occupancy),
                         "temperature": round(temperature, 2), "is_holiday": holiday})
    return prepare_features(pd.DataFrame(rows))


def prepare_features(data: pd.DataFrame) -> pd.DataFrame:
    required = {"timestamp", "hospital_id", "total_beds", "occupied_beds", "temperature", "is_holiday"}
    missing = required - set(data.columns)
    if missing:
        raise ValueError(f"Dataset missing: {', '.join(sorted(missing))}")
    frame = data.copy()
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="raise", utc=True)
    frame["facility_type"] = frame.get("facility_type", "Unknown").fillna("Unknown")
    frame = frame.sort_values(["hospital_id", "timestamp"])
    frame["current_occupancy"] = (100 * frame["occupied_beds"] / frame["total_beds"]).clip(0, 100)
    frame["hour"] = frame["timestamp"].dt.hour
    frame["day_of_week"] = frame["timestamp"].dt.dayofweek
    frame["occupancy_next_hour"] = frame.groupby("hospital_id")["current_occupancy"].shift(-1)
    return frame.dropna(subset=["occupancy_next_hour"])


def load_csv(path: Path) -> pd.DataFrame:
    return prepare_features(pd.read_csv(path))


def train_model(csv_path: Path | None = None) -> dict:
    data = load_csv(csv_path) if csv_path else generate_simulated_data()
    cutoff = data["timestamp"].quantile(.80)
    train, test = data[data["timestamp"] < cutoff], data[data["timestamp"] >= cutoff]
    categorical = ["facility_type"]
    numeric = [column for column in FEATURE_COLUMNS if column not in categorical]
    pipeline = Pipeline([
        ("features", ColumnTransformer([("category", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical)], remainder="passthrough")),
        ("model", HistGradientBoostingRegressor(max_iter=240, learning_rate=.07, max_leaf_nodes=31, l2_regularization=.8, random_state=42)),
    ])
    pipeline.fit(train[FEATURE_COLUMNS], train["occupancy_next_hour"])
    predicted = pipeline.predict(test[FEATURE_COLUMNS])
    baseline = test["current_occupancy"].to_numpy()
    metrics = {
        "mae": round(float(mean_absolute_error(test["occupancy_next_hour"], predicted)), 3),
        "rmse": round(float(mean_squared_error(test["occupancy_next_hour"], predicted) ** .5), 3),
        "r2": round(float(r2_score(test["occupancy_next_hour"], predicted)), 3),
        "baseline_mae": round(float(mean_absolute_error(test["occupancy_next_hour"], baseline)), 3),
        "training_rows": int(len(train)), "test_rows": int(len(test)),
        "split": "chronological_80_20", "dataset": "authorised_csv" if csv_path else "privacy_safe_simulation",
        "suitable_for_clinical_use": False,
    }
    sources = json.loads(SOURCES_PATH.read_text(encoding="utf-8")) if SOURCES_PATH.exists() else {}
    artifact = {"model": pipeline, "features": FEATURE_COLUMNS, "metrics": metrics, "version": "2.1", "data_sources": sources}
    joblib.dump(artifact, MODEL_PATH)
    joblib.dump(artifact, JOBLIB_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, help="Authorised de-identified hourly inventory CSV")
    args = parser.parse_args()
    print(json.dumps(train_model(args.data), indent=2))
