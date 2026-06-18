"""
AthenaCare AI — Hospital Recommendation Model Training
Trains XGBoost ranking model for hospital recommendations
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import ndcg_score
import joblib
import os
import json

print("🏥 AthenaCare AI — Training Hospital Recommendation Model")
print("=" * 60)

# ─── Generate Training Data ───────────────────────────────────────────────────

np.random.seed(42)
n_samples = 5000

# Features: [semantic_score, feature_score, rating, success_rate, country_match, budget_match, urgency_score]
X = np.column_stack([
    np.random.uniform(0.3, 1.0, n_samples),   # semantic_score
    np.random.uniform(0.4, 1.0, n_samples),   # feature_score
    np.random.uniform(3.5, 5.0, n_samples),   # rating
    np.random.uniform(0.80, 0.99, n_samples), # success_rate
    np.random.randint(0, 2, n_samples),        # country_match
    np.random.randint(0, 2, n_samples),        # budget_match
    np.random.uniform(0.5, 1.0, n_samples),   # urgency_score
])

# Target: relevance score (0-1)
y = (
    X[:, 0] * 0.35 +   # semantic similarity
    X[:, 1] * 0.25 +   # feature score
    (X[:, 2] / 5.0) * 0.15 +  # rating
    X[:, 3] * 0.10 +   # success rate
    X[:, 4] * 0.08 +   # country match
    X[:, 5] * 0.05 +   # budget match
    X[:, 6] * 0.02 +   # urgency
    np.random.normal(0, 0.02, n_samples)  # noise
)
y = np.clip(y, 0, 1)

print(f"✅ Generated {n_samples} training samples")
print(f"   Feature shape: {X.shape}")
print(f"   Target range: [{y.min():.3f}, {y.max():.3f}]")

# ─── Train XGBoost Model ──────────────────────────────────────────────────────

try:
    import xgboost as xgb
    from sklearn.metrics import mean_squared_error, r2_score

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
    )

    print("\n🔄 Training XGBoost model...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    # Evaluate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\n📊 Model Performance:")
    print(f"   MSE: {mse:.4f}")
    print(f"   R²: {r2:.4f}")
    print(f"   RMSE: {np.sqrt(mse):.4f}")

    # Feature importance
    feature_names = ["semantic_score", "feature_score", "rating", "success_rate",
                     "country_match", "budget_match", "urgency_score"]
    importance = dict(zip(feature_names, model.feature_importances_))
    print(f"\n🎯 Feature Importance:")
    for feat, imp in sorted(importance.items(), key=lambda x: -x[1]):
        print(f"   {feat}: {imp:.3f}")

    # Save model
    os.makedirs("../backend/models", exist_ok=True)
    model_path = "../backend/models/hospital_ranker.pkl"
    joblib.dump(model, model_path)
    print(f"\n✅ Model saved to {model_path}")

    # Save metadata
    metadata = {
        "model_type": "XGBoost Regressor",
        "features": feature_names,
        "n_estimators": 200,
        "r2_score": float(r2),
        "mse": float(mse),
        "training_samples": n_samples,
    }
    with open("../backend/models/hospital_ranker_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

except ImportError:
    print("⚠️  XGBoost not installed. Install with: pip install xgboost")
    print("   Saving sklearn GradientBoosting as fallback...")

    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.metrics import mean_squared_error, r2_score

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    print(f"   Fallback model R²: {r2:.4f}")

    os.makedirs("../backend/models", exist_ok=True)
    joblib.dump(model, "../backend/models/hospital_ranker.pkl")
    print("✅ Fallback model saved")

print("\n🎉 Training complete!")
