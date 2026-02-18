import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import json

# features: [current_occupancy, hour, day_of_week, temperature, is_holiday]
# target: [occupancy_next_hour]

def generate_synthetic_data(n_samples=5000):
    np.random.seed(42)
    data = []
    
    for _ in range(n_samples):
        hour = np.random.randint(0, 24)
        day_of_week = np.random.randint(0, 7)
        is_holiday = 1 if np.random.random() < 0.05 else 0
        temperature = np.random.normal(30, 5) # Jaipur temp
        
        # Base occupancy pattern (higher during day)
        base_occupancy = 100 + (50 * np.sin((hour - 8) * np.pi / 12)) 
        
        # Add random noise
        current_occupancy = max(0, int(np.random.normal(base_occupancy, 20)))
        
        # Target: Occupancy next hour (auto-regressive with trend)
        trend = np.random.normal(0, 5)
        if 8 <= hour <= 20: trend += 2 # Increasing during day
        else: trend -= 2 # Decreasing at night
        
        occupancy_next_hour = max(0, int(current_occupancy + trend))
        
        data.append([current_occupancy, hour, day_of_week, temperature, is_holiday, occupancy_next_hour])
        
    return pd.DataFrame(data, columns=['current_occupancy', 'hour', 'day_of_week', 'temperature', 'is_holiday', 'occupancy_next_hour'])

print("Generating synthetic data...")
df = generate_synthetic_data()

X = df.drop('occupancy_next_hour', axis=1)
y = df['occupancy_next_hour']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training XGBoost model...")
model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100)
model.fit(X_train, y_train)

preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)
print(f"Model trained. MAE: {mae:.2f}")

joblib.dump(model, 'occupancy_model.pkl')
print("Model saved to occupancy_model.pkl")
