"""
Simulation service.

Accepts what-if parameters (congestion_reduction, delay_reduction) and
projects the change in predicted satisfaction.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from models.train_models import get_satisfaction_model


def run_simulation(
    df: pd.DataFrame,
    congestion_reduction_pct: float = 0.0,
    delay_reduction_pct: float = 0.0,
) -> dict[str, Any]:
    """
    Simulate satisfaction improvement.

    Parameters
    ----------
    df : pd.DataFrame
        Processed dataset.
    congestion_reduction_pct : float
        Percentage reduction in congestion_index (0–100).
    delay_reduction_pct : float
        Percentage reduction in Avg_Delay_Min (0–100).

    Returns
    -------
    dict with baseline_satisfaction, projected_satisfaction, improvement_pct,
    and per-feature deltas.
    """
    result = get_satisfaction_model(df)
    model = result["model"]
    feature_names: list[str] = result["feature_names"]

    # Build a scenario dataframe from the full feature matrix
    X_full = df[feature_names].copy()

    # Baseline prediction (current state)
    baseline_pred = float(np.round(model.predict(X_full).mean(), 3))

    # Adjusted scenario
    X_sim = X_full.copy()
    if "congestion_index" in X_sim.columns:
        X_sim["congestion_index"] *= 1 - (congestion_reduction_pct / 100.0)
    if "Avg_Delay_Min" in X_sim.columns:
        X_sim["Avg_Delay_Min"] *= 1 - (delay_reduction_pct / 100.0)

    projected_pred = float(np.round(model.predict(X_sim).mean(), 3))

    improvement_pct = (
        round((projected_pred - baseline_pred) / baseline_pred * 100, 2)
        if baseline_pred != 0
        else 0.0
    )

    return {
        "congestion_reduction_pct": congestion_reduction_pct,
        "delay_reduction_pct": delay_reduction_pct,
        "baseline_satisfaction": baseline_pred,
        "projected_satisfaction": projected_pred,
        "improvement_pct": improvement_pct,
    }
