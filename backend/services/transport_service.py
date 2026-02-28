"""
Transport analytics service.

Analyses bus utilisation vs. delays and provides scatter-plot data.
"""
from __future__ import annotations

import pandas as pd
import numpy as np


def get_transport_analysis(df: pd.DataFrame) -> dict:
    """
    Return transport KPIs and per-record scatter data (utilization vs delay).
    """
    avg_utilization = float(np.round(df["transport_utilization"].mean(), 3))
    avg_delay = float(np.round(df["Avg_Delay_Min"].mean(), 2))
    max_delay = float(df["Avg_Delay_Min"].max())
    overcrowded_pct = float(
        np.round((df["transport_utilization"] > 1.0).mean() * 100, 1)
    )

    # Scatter data: sample up to 500 points for frontend performance
    sample = df if len(df) <= 500 else df.sample(500, random_state=42)
    scatter = (
        sample[["transport_utilization", "Avg_Delay_Min", "Zone", "Time_Slot"]]
        .rename(
            columns={
                "transport_utilization": "utilization",
                "Avg_Delay_Min": "delay",
                "Zone": "zone",
                "Time_Slot": "time_slot",
            }
        )
        .round(3)
    )

    return {
        "avg_utilization": avg_utilization,
        "avg_delay_min": avg_delay,
        "max_delay_min": max_delay,
        "overcrowded_pct": overcrowded_pct,
        "scatter": scatter.to_dict(orient="records"),
    }


def get_transport_by_zone(df: pd.DataFrame) -> list[dict]:
    """Average utilisation & delay grouped by Zone."""
    grouped = (
        df.groupby("Zone", as_index=False)
        .agg(
            avg_utilization=("transport_utilization", "mean"),
            avg_delay=("Avg_Delay_Min", "mean"),
            total_passengers=("Passengers", "sum"),
        )
        .round(3)
    )
    return grouped.to_dict(orient="records")
