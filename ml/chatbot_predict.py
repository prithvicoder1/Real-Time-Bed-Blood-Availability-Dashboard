"""JSON command-line inference contract used by the Node API."""
import json,sys
from pathlib import Path
import joblib

artifact=joblib.load(Path(__file__).resolve().parent/"chatbot_intent_model.joblib")
text=str(sys.argv[1] if len(sys.argv)>1 else "").strip()
probabilities=artifact["model"].predict_proba([text])[0]
index=int(probabilities.argmax())
print(json.dumps({"intent":str(artifact["model"].classes_[index]),"confidence":round(float(probabilities[index]),3),"modelVersion":artifact["version"]}))
