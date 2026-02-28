"""
Data loading, cleaning, and feature engineering for the Smart Campus dataset.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from config import DATASET_PATH, ZONE_CAPACITY


# ── Loading ──────────────────────────────────────────────────────
def load_raw_dataframe(path: str | None = None) -> pd.DataFrame:
    """Read the Excel file and return the raw DataFrame."""
    file_path = path or str(DATASET_PATH)
    df = pd.read_excel(file_path)
    return df


# ── Cleaning ─────────────────────────────────────────────────────
def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Handle missing values, coerce types, and fix known data-quality issues.

    Cleaning steps:
    1. Convert Security_Incidents to numeric (some rows contain the header string).
    2. Fill numeric nulls with column medians.
    3. Clip negative delays to 0.
    """
    df = df.copy()

    # Security_Incidents may contain the header string "Security_Incidents"
    df["Security_Incidents"] = pd.to_numeric(df["Security_Incidents"], errors="coerce")
    df["Security_Incidents"] = df["Security_Incidents"].fillna(0).astype(int)

    # Fill numeric nulls with median
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())

    # Clip negative delays to 0
    if "Avg_Delay_Min" in df.columns:
        df["Avg_Delay_Min"] = df["Avg_Delay_Min"].clip(lower=0)

    return df


# ── Feature Engineering ──────────────────────────────────────────
def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create computed columns required by analytics services:
      - zone_capacity        (lookup)
      - congestion_index     (footfall / zone_capacity)
      - waste_percent        ((prepared - sold) / prepared)
      - transport_utilization (passengers / bus_capacity)
      - zone_encoded / time_slot_encoded  (label encoding)
    """
    df = df.copy()

    # Zone capacity lookup
    df["zone_capacity"] = df["Zone"].map(ZONE_CAPACITY).fillna(200).astype(int)

    # Congestion index (safe division)
    df["congestion_index"] = np.where(
        df["zone_capacity"] > 0,
        df["Footfall"] / df["zone_capacity"],
        0.0,
    )

    # Waste percent  (prepared - sold) / prepared
    df["waste_percent"] = np.where(
        df["Prepared_Qty"] > 0,
        (df["Prepared_Qty"] - df["Orders"]) / df["Prepared_Qty"],
        0.0,
    )

    # Transport utilisation
    df["transport_utilization"] = np.where(
        df["Bus_Capacity"] > 0,
        df["Passengers"] / df["Bus_Capacity"],
        0.0,
    )

    # Categorical encoding
    df["zone_encoded"] = df["Zone"].astype("category").cat.codes
    df["time_slot_encoded"] = df["Time_Slot"].astype("category").cat.codes

    return df


# ── One-shot pipeline ────────────────────────────────────────────
def get_processed_dataframe(path: str | None = None) -> pd.DataFrame:
    """Load → Clean → Feature-engineer the full dataset."""
    df = load_raw_dataframe(path)
    df = clean_dataframe(df)
    df = add_engineered_features(df)
    return df
