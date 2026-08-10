"""Train CareBot's reproducible intent classifier from the curated utterance set."""
from __future__ import annotations
import json
from pathlib import Path
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import FeatureUnion, Pipeline

ROOT = Path(__file__).resolve().parent
DATASET = ROOT.parent / "backend" / "chatbot" / "dataset_enhanced.json"
MODEL = ROOT / "chatbot_intent_model.joblib"
METRICS = ROOT / "chatbot_metrics.json"

def load_training_data():
    rows = json.loads(DATASET.read_text(encoding="utf-8")); texts=[]; labels=[]
    prefixes=["", "please ", "can you help, "]
    for item in rows:
        for utterance in item["utterances"]:
            for prefix in prefixes: texts.append(prefix+utterance);labels.append(item["intent"])
    return texts, labels, rows

def build_pipeline():
    features=FeatureUnion([
        ("words",TfidfVectorizer(ngram_range=(1,2),sublinear_tf=True,min_df=1,strip_accents="unicode")),
        ("chars",TfidfVectorizer(analyzer="char_wb",ngram_range=(3,5),sublinear_tf=True,min_df=1,max_features=18000)),
    ])
    return Pipeline([("features",features),("classifier",LogisticRegression(C=7,class_weight="balanced",max_iter=1500,random_state=42))])

def train():
    texts,labels,rows=load_training_data();model=build_pipeline();evaluation_texts=[utterance for item in rows for utterance in item["utterances"]];evaluation_labels=[item["intent"] for item in rows for _ in item["utterances"]];counts=np.unique(evaluation_labels,return_counts=True)[1];folds=max(2,min(5,int(counts.min())))
    scores=cross_val_score(model,evaluation_texts,evaluation_labels,cv=StratifiedKFold(folds,shuffle=True,random_state=42),scoring="accuracy")
    model.fit(texts,labels);metrics={"training_examples":len(texts),"evaluation_examples":len(evaluation_texts),"intents":len(set(labels)),"cv_folds":folds,"cv_accuracy_mean":round(float(scores.mean()),3),"cv_accuracy_std":round(float(scores.std()),3),"engine":"word_and_character_tfidf_logistic_regression","suitable_for_medical_diagnosis":False}
    joblib.dump({"model":model,"metrics":metrics,"intents":[item["intent"] for item in rows],"version":"1.0"},MODEL);METRICS.write_text(json.dumps(metrics,indent=2)+"\n",encoding="utf-8");return metrics

if __name__ == "__main__": print(json.dumps(train(),indent=2))
