"""
Congestion analytics service.

Provides zone × time-slot heatmap data and bottleneck detection.
"""
from __future__ import annotations

import pandas as pd


def get_congestion_heatmap(df: pd.DataFrame) -> list[dict]:
    """
    Aggregate mean congestion_index by Zone × Time_Slot.

    Returns a list of dicts:
        [{"zone": "Library", "time_slot": "Morning", "congestion_index": 0.82}, ...]
    """
    grouped = (
        df.groupby(["Zone", "Time_Slot"], as_index=False)["congestion_index"]
        .mean()
        .round(3)
    )
    grouped.columns = ["zone", "time_slot", "congestion_index"]
    return grouped.to_dict(orient="records")


def get_bottlenecks(df: pd.DataFrame, threshold: float = 0.85) -> list[dict]:
    """
    Return zone-time combinations where average congestion_index exceeds *threshold*.
    """
    heatmap = get_congestion_heatmap(df)
    return [row for row in heatmap if row["congestion_index"] >= threshold]


def get_congestion_summary(df: pd.DataFrame) -> dict:
    """
    High-level congestion summary:
      - overall_avg_congestion
      - most_congested_zone
      - most_congested_time_slot
      - bottleneck_count (cells ≥ 0.85)
    """
    heatmap = get_congestion_heatmap(df)
    heatmap_df = pd.DataFrame(heatmap)

    worst_row = heatmap_df.loc[heatmap_df["congestion_index"].idxmax()]

    return {
        "overall_avg_congestion": round(heatmap_df["congestion_index"].mean(), 3),
        "most_congested_zone": worst_row["zone"],
        "most_congested_time_slot": worst_row["time_slot"],
        "bottleneck_count": int((heatmap_df["congestion_index"] >= 0.85).sum()),
        "heatmap": heatmap,
    }
