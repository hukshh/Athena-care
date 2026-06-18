"""
AthenaCare AI — Treatment Cost Predictor Training
Trains XGBoost model for medical cost estimation
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os
import json

print("💰 AthenaCare AI — Training Cost Predictor Model")
print("=" * 60)

# ─── Generate Training Data ───────────────────────────────────────────────────

procedures = [
    "CABG", "Knee Replacement", "Hip Replacement", "Spinal Fusion",
    "Heart Valve", "Liver Transplant", "Kidney Transplant", "Chemotherapy",
    "Brain Surgery", "Cataract", "Dental Implants", "IVF",
]

countries = ["India", "Thailand", "Turkey", "Singapore", "Malaysia", "Germany", "South Korea", "USA"]

base_costs = {
    ("CABG", "India"): 11000, ("CABG", "Thailand"): 22000, ("CABG", "Turkey"): 16000,
    ("CABG", "Singapore"): 32000, ("CABG", "USA"): 95000,
    ("Knee Replacement", "India"): 6000, ("Knee Replacement", "Thailand"): 13000,
    ("Knee Replacement", "Turkey"): 11000, ("Knee Replacement", "USA"): 52000,
    ("Hip Replacement", "India"): 7000, ("Hip Replacement", "Thailand"): 15000,
    ("Hip Replacement", "USA"): 55000,
    ("Liver Transplant", "India"): 32000, ("Liver Transplant", "USA"): 400000,
    ("Kidney Transplant", "India"): 15000, ("Kidney Transplant", "USA"): 150000,
}

np.random.seed(42)
records = []

for _ in range(8000):
    procedure = np.random.choice(procedures)
    country = np.random.choice(countries)
    age = np.random.randint(18, 80)
    complexity = np.random.choice(["simple", "standard", "complex"], p=[0.2, 0.6, 0.2])

    # Get base cost
    key = (procedure, country)
    if key in base_costs:
        base = base_costs[key]
    else:
        country_mult = {"India": 0.12, "Thailand": 0.23, "Turkey": 0.17,
                        "Singapore": 0.34, "Malaysia": 0.15, "Germany": 0.47,
                        "South Korea": 0.29, "USA": 1.0}
        base = 50000 * country_mult.get(country, 0.25)

    # Apply factors
    age_factor = 0.9 if age < 30 else (1.0 if age < 50 else (1.15 if age < 65 else 1.3))
    complexity_factor = {"simple": 0.8, "standard": 1.0, "complex": 1.4}[complexity]
    noise = np.random.normal(1.0, 0.08)

    cost = base * age_factor * complexity_factor * noise

    records.append({
        "procedure": procedure,
        "country": country,
        "age": age,
        "complexity": complexity,
        "cost": max(cost, 500),
    })

df = pd.DataFrame(records)
print(f"✅ Generated {len(df)} training samples")
print(f"\nCost statistics:")
print(df["cost"].describe().round(0))

# ─── Encode Features ─────────────────────────────────────────────────────────

le_proc = LabelEncoder()
le_country = LabelEncoder()
le_complexity = LabelEncoder()

df["procedure_enc"] = le_proc.fit_transform(df["procedure"])
df["country_enc"] = le_country.fit_transform(df["country"])
df["complexity_enc"] = le_complexity.fit_transform(df["complexity"])

feature_cols = ["procedure_enc", "country_enc", "age", "complexity_enc"]
X = df[feature_cols].values
y = df["cost"].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ─── Train Model ─────────────────────────────────────────────────────────────

try:
    import xgboost as xgb

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=7,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        random_state=42,
        n_jobs=-1,
    )

    print("\n🔄 Training XGBoost cost predictor...")
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=100)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

    print(f"\n📊 Model Performance:")
    print(f"   MAE: ${mae:,.0f}")
    print(f"   R²: {r2:.4f}")
    print(f"   MAPE: {mape:.1f}%")
    print(f"   Accuracy: {100 - mape:.1f}%")

    # Save
    os.makedirs("../backend/models", exist_ok=True)
    bundle = {
        "model": model,
        "le_procedure": le_proc,
        "le_country": le_country,
        "le_complexity": le_complexity,
        "feature_cols": feature_cols,
    }
    joblib.dump(bundle, "../backend/models/cost_predictor.pkl")
    print(f"\n✅ Cost predictor saved to ../backend/models/cost_predictor.pkl")

    metadata = {
        "model_type": "XGBoost Regressor",
        "mae": float(mae),
        "r2": float(r2),
        "mape": float(mape),
        "training_samples": len(df),
        "procedures": list(le_proc.classes_),
        "countries": list(le_country.classes_),
    }
    with open("../backend/models/cost_predictor_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

except ImportError:
    print("⚠️  XGBoost not installed. Using sklearn RandomForest...")
    from sklearn.ensemble import RandomForestRegressor

    model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    print(f"   Fallback model R²: {r2:.4f}")

    os.makedirs("../backend/models", exist_ok=True)
    bundle = {"model": model, "le_procedure": le_proc, "le_country": le_country,
              "le_complexity": le_complexity, "feature_cols": feature_cols}
    joblib.dump(bundle, "../backend/models/cost_predictor.pkl")
    print("✅ Fallback model saved")

print("\n🎉 Cost predictor training complete!")
