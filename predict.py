import sys
import json
import joblib
import pandas as pd
import numpy as np

# Load model
try:
    model = joblib.load('../ml/occupancy_model.pkl')
except:
    # Fallback if model not trained yet
    model = None

def predict(data):
    if not model:
        # Mock prediction if no model
        current = data.get('current_occupancy', 100)
        return current + np.random.randint(-5, 10)
        
    df = pd.DataFrame([data])
    prediction = model.predict(df)[0]
    return int(prediction)

if __name__ == '__main__':
    # Read input from Node.js
    input_data = json.loads(sys.argv[1])
    result = predict(input_data)
    print(json.dumps({'prediction': result}))
