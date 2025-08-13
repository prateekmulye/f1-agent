#!/usr/bin/env python3
import json, numpy as np, pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import brier_score_loss, log_loss

df = pd.read_csv("data/historical_features.csv")

y = (df["points"] > 0).astype(int).values
feat_cols = ["quali_pos","avg_fp_longrun_delta","constructor_form","driver_form","circuit_effect","weather_risk"]
X = df[feat_cols].fillna(0).values

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=500, random_state=7))
])
pipe.fit(X, y)

probs = pipe.predict_proba(X)[:, 1]
print("Brier:", round(brier_score_loss(y, probs), 4), "LogLoss:", round(log_loss(y, probs), 4))

coefs = pipe.named_steps["clf"].coef_[0]
model = [{"feature": c, "weight": float(w)} for c, w in zip(feat_cols, coefs)]
with open("data/model.json", "w") as f:
    json.dump(model, f, indent=2)
print("Model saved to data/model.json")