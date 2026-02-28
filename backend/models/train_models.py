"""
ML model training and caching.

Models:
  1. Food Demand Prediction  – LinearRegression (predict Orders from footfall, zone, time)
  2. Satisfaction Prediction  – RandomForestRegressor (predict Satisfaction from operational metrics)
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from config import RANDOM_STATE, TEST_SIZE


# ── Helpers ──────────────────────────────────────────────────────

def _split(
    X: pd.DataFrame, y: pd.Series
) -> tuple[pd.DataFrame, pd.DataFrame, np.ndarray, np.ndarray]:
    """Standard train/test split wrapper."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    return X_train, X_test, np.asarray(y_train), np.asarray(y_test)


# ── Food Demand Model ────────────────────────────────────────────

_food_model_cache: dict[str, Any] | None = None


def get_food_demand_model(df: pd.DataFrame) -> dict[str, Any]:
    """
    Train (or return cached) LinearRegression to predict Orders (sold).

    Features: Footfall, zone_encoded, time_slot_encoded
    Target:   Orders
    """
    global _food_model_cache
    if _food_model_cache is not None:
        return _food_model_cache

    feature_cols = ["Footfall", "zone_encoded", "time_slot_encoded"]
    target = "Orders"

    X = df[feature_cols].copy()
    y = df[target].copy()

    X_train, X_test, y_train, y_test = _split(X, y)

    model = LinearRegression()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = round(float(r2_score(y_test, y_pred)), 4)
    mae = round(float(mean_absolute_error(y_test, y_pred)), 4)

    _food_model_cache = {
        "model": model,
        "feature_names": feature_cols,
        "r2": r2,
        "mae": mae,
        "X_test": X_test,
        "y_test": y_test,
    }
    return _food_model_cache


# ── Satisfaction Model ───────────────────────────────────────────

_satisfaction_model_cache: dict[str, Any] | None = None


def get_satisfaction_model(df: pd.DataFrame) -> dict[str, Any]:
    """
    Train (or return cached) RandomForestRegressor to predict Satisfaction.

    Features: congestion_index, Avg_Delay_Min, waste_percent, Response_Time_hr
    Target:   Satisfaction
    """
    global _satisfaction_model_cache
    if _satisfaction_model_cache is not None:
        return _satisfaction_model_cache

    feature_cols = [
        "congestion_index",
        "Avg_Delay_Min",
        "waste_percent",
        "Response_Time_hr",
    ]
    target = "Satisfaction"

    X = df[feature_cols].copy()
    y = df[target].copy()

    X_train, X_test, y_train, y_test = _split(X, y)

    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = round(float(r2_score(y_test, y_pred)), 4)
    mae = round(float(mean_absolute_error(y_test, y_pred)), 4)

    _satisfaction_model_cache = {
        "model": model,
        "feature_names": feature_cols,
        "r2": r2,
        "mae": mae,
        "X_test": X_test,
        "y_test": y_test,
    }
    return _satisfaction_model_cache
