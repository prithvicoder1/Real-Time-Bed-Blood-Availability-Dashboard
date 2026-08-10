"""Lightweight verification for the training artifact and prediction contract."""

import unittest

from predict import forecast
from train import FEATURE_COLUMNS, MODEL_PATH, train_model


class OccupancyModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        train_model()

    def test_training_creates_model_with_useful_metrics(self):
        self.assertTrue(MODEL_PATH.exists())
        metrics = train_model()
        self.assertLess(metrics["mae"], 8)
        self.assertGreater(metrics["r2"], 0.8)

    def test_forecast_returns_bounded_values(self):
        result = forecast({"current_occupancy": 82, "hour": 10, "day_of_week": 2})
        self.assertEqual(len(result["occupancy_trend"]), 7)
        self.assertTrue(all(0 <= item <= 100 for item in result["occupancy_trend"]))
        self.assertEqual(len(FEATURE_COLUMNS), 6)
        self.assertFalse(result["metrics"]["suitable_for_clinical_use"])


if __name__ == "__main__":
    unittest.main()
