"""
Food-waste and demand analytics service.

Analyses prepared vs. sold mismatch and provides data for waste trend charts.
"""
from __future__ import annotations

import pandas as pd
import numpy as np


def get_food_waste_analysis(df: pd.DataFrame) -> dict:
    """
    Return aggregated waste metrics grouped by Meal_Type:
      - avg_waste_percent
      - total_waste_qty
      - total_prepared
      - total_orders (sold)
    Plus an overall summary and per-zone breakdown.
    """
    by_meal = (
        df.groupby("Meal_Type", as_index=False)
        .agg(
            avg_waste_percent=("waste_percent", "mean"),
            total_waste=("Waste_Qty", "sum"),
            total_prepared=("Prepared_Qty", "sum"),
            total_sold=("Orders", "sum"),
        )
        .round(3)
    )

    by_zone = (
        df.groupby("Zone", as_index=False)
        .agg(
            avg_waste_percent=("waste_percent", "mean"),
            total_waste=("Waste_Qty", "sum"),
            total_prepared=("Prepared_Qty", "sum"),
            total_sold=("Orders", "sum"),
        )
        .round(3)
    )

    overall_waste_pct = float(np.round(df["waste_percent"].mean(), 3))
    total_waste_qty = int(df["Waste_Qty"].sum())

    return {
        "overall_waste_percent": overall_waste_pct,
        "total_waste_qty": total_waste_qty,
        "by_meal_type": by_meal.to_dict(orient="records"),
        "by_zone": by_zone.to_dict(orient="records"),
    }


def get_waste_trend(df: pd.DataFrame) -> list[dict]:
    """
    Daily waste trend: date → avg waste_percent and total waste qty.
    Useful for time-series charting on the frontend.
    """
    df = df.copy()
    df["date_str"] = df["Date"].dt.strftime("%Y-%m-%d")

    trend = (
        df.groupby("date_str", as_index=False)
        .agg(
            avg_waste_percent=("waste_percent", "mean"),
            total_waste=("Waste_Qty", "sum"),
        )
        .round(3)
        .sort_values("date_str")
    )
    return trend.to_dict(orient="records")
