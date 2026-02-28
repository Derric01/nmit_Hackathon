"""
Satisfaction impact analytics service.

Uses the trained RandomForest model to explain feature importance and
return predicted vs actual satisfaction.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from models.train_models import get_satisfaction_model


def get_satisfaction_impact(df: pd.DataFrame) -> dict[str, Any]:
    """
    Train (or retrieve cached) satisfaction model and return:
      - feature importances
      - model metrics (R2, MAE)
      - sample predicted vs actual values
    """
    result = get_satisfaction_model(df)

    # Predictions on test set for chart
    model = result["model"]
    X_test: pd.DataFrame = result["X_test"]
    y_test: np.ndarray = result["y_test"]
    y_pred = model.predict(X_test)

    comparison = (
        pd.DataFrame(
            {
                "actual": np.round(y_test, 2),
                "predicted": np.round(y_pred, 2),
            }
        )
        .head(100)
        .to_dict(orient="records")
    )

    feature_names: list[str] = result["feature_names"]
    importances: list[float] = [
        round(float(v), 4) for v in result["model"].feature_importances_
    ]

    return {
        "r2_score": result["r2"],
        "mae": result["mae"],
        "feature_importance": [
            {"feature": f, "importance": i}
            for f, i in sorted(
                zip(feature_names, importances), key=lambda x: x[1], reverse=True
            )
        ],
        "comparison_sample": comparison,
    }
