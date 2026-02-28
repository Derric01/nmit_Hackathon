"""
Strategic Interventions analytics service.

Analyses all operational domains (congestion, food waste, transport, satisfaction)
and surfaces data-backed recommendations ranked by impact and priority.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from models.train_models import get_satisfaction_model


# ── Priority thresholds ───────────────────────────────────────────
_CONGESTION_CRITICAL = 0.85
_CONGESTION_HIGH = 0.70
_WASTE_CRITICAL = 0.30          # 30 % waste rate
_WASTE_HIGH = 0.20
_UTILIZATION_OVERCROWD = 1.0
_DELAY_HIGH_MIN = 10.0


def _priority_label(value: float, high: float, critical: float) -> str:
    if value >= critical:
        return "critical"
    if value >= high:
        return "high"
    return "medium"


# ── Congestion interventions ─────────────────────────────────────

def _congestion_interventions(df: pd.DataFrame) -> list[dict[str, Any]]:
    zone_time = (
        df.groupby(["Zone", "Time_Slot"], as_index=False)["congestion_index"]
        .mean()
        .round(3)
    )
    overall_avg = float(zone_time["congestion_index"].mean())

    # Worst zone overall
    by_zone = zone_time.groupby("Zone")["congestion_index"].mean().sort_values(ascending=False)
    worst_zone = by_zone.index[0]
    worst_zone_val = float(by_zone.iloc[0])

    # Worst time slot overall
    by_slot = zone_time.groupby("Time_Slot")["congestion_index"].mean().sort_values(ascending=False)
    peak_slot = by_slot.index[0]
    peak_slot_val = float(by_slot.iloc[0])

    # Bottleneck count (≥ critical threshold)
    bottleneck_count = int((zone_time["congestion_index"] >= _CONGESTION_CRITICAL).sum())

    # Top 3 hotspot zone-slot pairs
    top_hotspots = (
        zone_time.nlargest(3, "congestion_index")[["Zone", "Time_Slot", "congestion_index"]]
        .rename(columns={"Zone": "zone", "Time_Slot": "time_slot"})
        .to_dict(orient="records")
    )

    priority = _priority_label(worst_zone_val, _CONGESTION_HIGH, _CONGESTION_CRITICAL)

    interventions = []

    # Intervention 1 – Staggered Scheduling
    interventions.append({
        "id": "cong-1",
        "category": "congestion",
        "priority": priority,
        "title": "Implement Dynamic Staggered Scheduling",
        "insight": (
            f"Zone '{worst_zone}' records a mean congestion index of {worst_zone_val:.2f}, "
            f"{round((worst_zone_val - overall_avg) / overall_avg * 100, 1)}% above campus average "
            f"({overall_avg:.2f}). Peak pressure occurs during {peak_slot} "
            f"(avg index {peak_slot_val:.2f})."
        ),
        "recommendations": [
            f"Stagger class start times across faculties in '{worst_zone}' by 15-minute intervals during {peak_slot}.",
            "Deploy digital crowd-density displays at zone entry points to redirect foot traffic in real time.",
            "Activate overflow corridors and temporary seating during peak periods.",
        ],
        "metric": worst_zone_val,
        "metric_label": "Peak zone congestion index",
        "metric_format": "decimal",
        "projected_impact": round(min(25, (worst_zone_val - overall_avg) / overall_avg * 60), 1),
        "projected_impact_label": "Est. congestion reduction",
        "evidence": {
            "worst_zone": worst_zone,
            "worst_zone_index": worst_zone_val,
            "peak_time_slot": peak_slot,
            "peak_slot_index": peak_slot_val,
            "campus_avg_congestion": overall_avg,
            "bottleneck_cells": bottleneck_count,
            "top_hotspots": top_hotspots,
        },
    })

    # Intervention 2 – Smart Entry Management
    if bottleneck_count > 0:
        interventions.append({
            "id": "cong-2",
            "category": "congestion",
            "priority": "high" if bottleneck_count > 3 else "medium",
            "title": "Deploy AI-Driven Entry & Flow Management",
            "insight": (
                f"{bottleneck_count} zone-time combinations exceed the critical congestion threshold "
                f"of {_CONGESTION_CRITICAL}. These hotspots collectively risk unsafe crowding and "
                f"degrade pedestrian experience."
            ),
            "recommendations": [
                "Install IoT occupancy sensors at identified bottleneck entries for real-time headcount.",
                "Integrate live congestion feed into campus mobile app for crowd-aware routing.",
                "Create clearly marked alternate walking paths diverging from the top-3 hotspot zones.",
            ],
            "metric": bottleneck_count,
            "metric_label": "Critical bottleneck zones",
            "metric_format": "integer",
            "projected_impact": round(min(35, bottleneck_count * 6), 1),
            "projected_impact_label": "Est. bottleneck reduction",
            "evidence": {
                "bottleneck_count": bottleneck_count,
                "threshold": _CONGESTION_CRITICAL,
                "top_hotspots": top_hotspots,
            },
        })

    return interventions


# ── Food-waste interventions ──────────────────────────────────────

def _food_interventions(df: pd.DataFrame) -> list[dict[str, Any]]:
    overall_waste_pct = float(df["waste_percent"].mean())

    by_meal = (
        df.groupby("Meal_Type", as_index=False)
        .agg(
            avg_waste=("waste_percent", "mean"),
            total_waste=("Waste_Qty", "sum"),
            total_prepared=("Prepared_Qty", "sum"),
        )
        .sort_values("avg_waste", ascending=False)
        .round(3)
    )
    worst_meal = by_meal.iloc[0]["Meal_Type"]
    worst_meal_waste = float(by_meal.iloc[0]["avg_waste"])

    by_zone = (
        df.groupby("Zone", as_index=False)
        .agg(avg_waste=("waste_percent", "mean"))
        .sort_values("avg_waste", ascending=False)
        .round(3)
    )
    worst_zone = by_zone.iloc[0]["Zone"]
    worst_zone_waste = float(by_zone.iloc[0]["avg_waste"])

    total_waste_units = int(df["Waste_Qty"].sum())
    total_prepared = int(df["Prepared_Qty"].sum())

    priority = _priority_label(overall_waste_pct, _WASTE_HIGH, _WASTE_CRITICAL)

    interventions = []

    # Intervention – Demand Forecasting
    interventions.append({
        "id": "food-1",
        "category": "food",
        "priority": priority,
        "title": "ML-Powered Demand Forecasting for Prep Quantities",
        "insight": (
            f"Overall food waste averages {overall_waste_pct * 100:.1f}% of prepared quantities. "
            f"'{worst_meal}' is the worst-performing meal type at {worst_meal_waste * 100:.1f}% waste rate — "
            f"{round((worst_meal_waste - overall_waste_pct) / overall_waste_pct * 100, 1)}% above average. "
            f"Campus-wide, {total_waste_units:,} units were wasted out of {total_prepared:,} prepared."
        ),
        "recommendations": [
            f"Apply trained demand forecasting model to dynamically calibrate prep quantities for '{worst_meal}' based on historical attendance and day-of-week patterns.",
            "Implement a real-time order-tracking dashboard for kitchen managers showing live surplus alerts.",
            "Introduce a sliding prep schedule: prepare 70% upfront and 30% in rolling batches during the meal window.",
        ],
        "metric": worst_meal_waste * 100,
        "metric_label": f"{worst_meal} waste rate (%)",
        "metric_format": "percent",
        "projected_impact": round(min(40, (worst_meal_waste - overall_waste_pct) / overall_waste_pct * 50), 1),
        "projected_impact_label": "Est. waste reduction",
        "evidence": {
            "overall_waste_pct": round(overall_waste_pct * 100, 2),
            "worst_meal_type": worst_meal,
            "worst_meal_waste_pct": round(worst_meal_waste * 100, 2),
            "total_waste_units": total_waste_units,
            "total_prepared_units": total_prepared,
            "by_meal": by_meal[["Meal_Type", "avg_waste"]].rename(
                columns={"avg_waste": "waste_pct"}
            ).to_dict(orient="records"),
        },
    })

    # Intervention – Zone-Level Surplus Management
    interventions.append({
        "id": "food-2",
        "category": "food",
        "priority": "high" if worst_zone_waste > _WASTE_HIGH else "medium",
        "title": "Zone-Level Surplus Redistribution Programme",
        "insight": (
            f"Zone '{worst_zone}' records the highest average food waste at "
            f"{worst_zone_waste * 100:.1f}%, indicating systematic over-preparation "
            f"disconnected from local demand patterns."
        ),
        "recommendations": [
            f"Establish a real-time surplus-sharing channel between '{worst_zone}' and adjacent lower-demand zones.",
            "Partner with on-campus food banks or student initiatives to redistribute end-of-service surpluses.",
            "Set zone-level waste KPI targets and tie them to monthly kitchen performance reviews.",
        ],
        "metric": worst_zone_waste * 100,
        "metric_label": f"{worst_zone} waste rate (%)",
        "metric_format": "percent",
        "projected_impact": round(min(30, worst_zone_waste * 60), 1),
        "projected_impact_label": "Est. zone waste reduction",
        "evidence": {
            "worst_zone": worst_zone,
            "worst_zone_waste_pct": round(worst_zone_waste * 100, 2),
            "by_zone": by_zone.head(5).to_dict(orient="records"),
        },
    })

    return interventions


# ── Transport interventions ───────────────────────────────────────

def _transport_interventions(df: pd.DataFrame) -> list[dict[str, Any]]:
    avg_utilization = float(df["transport_utilization"].mean())
    avg_delay = float(df["Avg_Delay_Min"].mean())
    overcrowded_pct = float((df["transport_utilization"] > _UTILIZATION_OVERCROWD).mean() * 100)
    max_delay = float(df["Avg_Delay_Min"].max())

    by_zone = (
        df.groupby("Zone", as_index=False)
        .agg(
            avg_util=("transport_utilization", "mean"),
            avg_delay=("Avg_Delay_Min", "mean"),
            total_passengers=("Passengers", "sum"),
        )
        .sort_values("avg_delay", ascending=False)
        .round(3)
    )
    worst_delay_zone = by_zone.iloc[0]["Zone"]
    worst_delay_val = float(by_zone.iloc[0]["avg_delay"])
    worst_util_zone = by_zone.sort_values("avg_util", ascending=False).iloc[0]["Zone"]
    worst_util_val = float(by_zone.sort_values("avg_util", ascending=False).iloc[0]["avg_util"])

    by_slot = (
        df.groupby("Time_Slot", as_index=False)
        .agg(avg_util=("transport_utilization", "mean"), avg_delay=("Avg_Delay_Min", "mean"))
        .sort_values("avg_delay", ascending=False)
        .round(3)
    )
    peak_slot = by_slot.iloc[0]["Time_Slot"]
    peak_slot_delay = float(by_slot.iloc[0]["avg_delay"])

    interventions = []

    # Intervention – Dynamic Fleet Scheduling
    delay_priority = _priority_label(avg_delay, _DELAY_HIGH_MIN * 0.5, _DELAY_HIGH_MIN)
    interventions.append({
        "id": "trans-1",
        "category": "transport",
        "priority": delay_priority,
        "title": "Dynamic Fleet Scheduling & Real-Time Route Optimisation",
        "insight": (
            f"Average transport delay across campus is {avg_delay:.1f} minutes (max {max_delay:.1f} min). "
            f"Peak delays concentrate during '{peak_slot}' ({peak_slot_delay:.1f} min avg). "
            f"Zone '{worst_delay_zone}' experiences the highest mean delay of {worst_delay_val:.1f} min."
        ),
        "recommendations": [
            f"Deploy additional bus frequency during '{peak_slot}' — specifically increasing capacity to and from '{worst_delay_zone}'.",
            "Integrate a predictive delay model into the driver dispatch system to pre-position vehicles before peak demand.",
            "Pilot an express shuttle between the 2 highest-traffic zones during rush hours to bypass intermediate stops.",
        ],
        "metric": avg_delay,
        "metric_label": "Avg delay (min)",
        "metric_format": "decimal",
        "projected_impact": round(min(40, avg_delay * 2.5), 1),
        "projected_impact_label": "Est. delay reduction",
        "evidence": {
            "avg_delay_min": round(avg_delay, 2),
            "max_delay_min": round(max_delay, 2),
            "peak_time_slot": peak_slot,
            "peak_slot_delay": peak_slot_delay,
            "worst_delay_zone": worst_delay_zone,
            "worst_delay_val": worst_delay_val,
            "by_zone": by_zone.head(5).to_dict(orient="records"),
        },
    })

    # Intervention – Overcrowding & Capacity Management
    if overcrowded_pct > 5:
        interventions.append({
            "id": "trans-2",
            "category": "transport",
            "priority": "critical" if overcrowded_pct > 25 else "high",
            "title": "Overcrowding Elimination via Smart Capacity Management",
            "insight": (
                f"{overcrowded_pct:.1f}% of transport runs exceed 100% vehicle utilisation. "
                f"Zone '{worst_util_zone}' averages {worst_util_val:.2f}× capacity load. "
                f"Chronic overcrowding degrades safety, punctuality, and rider satisfaction."
            ),
            "recommendations": [
                "Roll out a seat-reservation system via the campus app to flatten demand spikes across routes.",
                f"Add dedicated overflow capacity (standby vehicles) for '{worst_util_zone}' during identified peak slots.",
                "Introduce dynamic ride-share matching to reduce single-use trips and even out vehicle loads.",
            ],
            "metric": overcrowded_pct,
            "metric_label": "Overcrowded runs (%)",
            "metric_format": "percent",
            "projected_impact": round(min(35, overcrowded_pct * 0.8), 1),
            "projected_impact_label": "Est. overcrowding reduction",
            "evidence": {
                "overcrowded_pct": round(overcrowded_pct, 2),
                "avg_utilization": round(avg_utilization, 3),
                "worst_util_zone": worst_util_zone,
                "worst_util_val": round(worst_util_val, 3),
            },
        })

    return interventions


# ── Satisfaction interventions ────────────────────────────────────

def _satisfaction_interventions(df: pd.DataFrame) -> list[dict[str, Any]]:
    result = get_satisfaction_model(df)
    model = result["model"]
    feature_names: list[str] = result["feature_names"]
    importances = [float(v) for v in model.feature_importances_]

    feat_imp = sorted(
        zip(feature_names, importances), key=lambda x: x[1], reverse=True
    )

    avg_sat = float(df["Satisfaction"].mean())
    sat_std = float(df["Satisfaction"].std())

    # Correlation between top features and satisfaction
    top_features = [f for f, _ in feat_imp[:4]]
    correlations = {
        f: round(float(df[f].corr(df["Satisfaction"])), 3)
        for f in top_features
        if f in df.columns
    }

    # Low-satisfaction zones
    by_zone_sat = (
        df.groupby("Zone")["Satisfaction"].mean().sort_values().round(3)
    )
    lowest_sat_zone = by_zone_sat.index[0]
    lowest_sat_val = float(by_zone_sat.iloc[0])

    top_driver = feat_imp[0][0]
    top_driver_importance = round(feat_imp[0][1] * 100, 1)
    second_driver = feat_imp[1][0] if len(feat_imp) > 1 else None
    second_driver_importance = round(feat_imp[1][1] * 100, 1) if len(feat_imp) > 1 else 0

    # Readable feature name mapping
    readable = {
        "congestion_index": "Congestion Index",
        "waste_percent": "Food Waste Rate",
        "transport_utilization": "Transport Utilisation",
        "Avg_Delay_Min": "Transport Delay",
        "zone_encoded": "Campus Zone",
        "time_slot_encoded": "Time of Day",
    }
    top_driver_label = readable.get(top_driver, top_driver)
    second_driver_label = readable.get(second_driver, second_driver) if second_driver else ""

    interventions = []

    # Intervention – Target Top Satisfaction Driver
    priority = "critical" if avg_sat < 3.0 else ("high" if avg_sat < 3.5 else "medium")
    interventions.append({
        "id": "sat-1",
        "category": "satisfaction",
        "priority": priority,
        "title": f"Reduce '{top_driver_label}' — The #1 Satisfaction Driver",
        "insight": (
            f"ML feature importance reveals '{top_driver_label}' accounts for "
            f"{top_driver_importance:.1f}% of satisfaction variance (model R² = {result['r2']:.3f}). "
            f"Campus average satisfaction is {avg_sat:.2f}/5.0 (σ = {sat_std:.2f}). "
            f"Targeting this lever directly unlocks the largest satisfaction gain per unit of investment."
        ),
        "recommendations": [
            f"Set a formal reduction target for '{top_driver_label}' with weekly KPI reviews.",
            f"Allocate dedicated operational budget to the top-3 interventions targeting '{top_driver_label}'.",
            "Create a closed-loop feedback dashboard allowing students to report issues instantly, enabling sub-24h response.",
        ],
        "metric": top_driver_importance,
        "metric_label": f"'{top_driver_label}' importance (%)",
        "metric_format": "percent",
        "projected_impact": round(min(30, top_driver_importance * 0.4), 1),
        "projected_impact_label": "Est. satisfaction uplift",
        "evidence": {
            "avg_satisfaction": round(avg_sat, 3),
            "satisfaction_std": round(sat_std, 3),
            "model_r2": result["r2"],
            "model_mae": result["mae"],
            "top_driver": top_driver,
            "top_driver_label": top_driver_label,
            "top_driver_importance_pct": top_driver_importance,
            "feature_importances": [
                {"feature": readable.get(f, f), "importance_pct": round(imp * 100, 2)}
                for f, imp in feat_imp[:6]
            ],
            "correlations": {readable.get(k, k): v for k, v in correlations.items()},
        },
    })

    # Intervention – Zone-Specific Satisfaction Recovery
    gap_pct = round((avg_sat - lowest_sat_val) / avg_sat * 100, 1)
    interventions.append({
        "id": "sat-2",
        "category": "satisfaction",
        "priority": "high" if gap_pct > 10 else "medium",
        "title": f"Targeted Satisfaction Recovery in Zone '{lowest_sat_zone}'",
        "insight": (
            f"Zone '{lowest_sat_zone}' records the lowest average satisfaction score of "
            f"{lowest_sat_val:.2f}/5.0 — {gap_pct}% below the campus mean of {avg_sat:.2f}. "
            f"Concentrated interventions in this zone offer the highest marginal return."
        ),
        "recommendations": [
            f"Conduct monthly student experience audits in '{lowest_sat_zone}' to identify zone-specific pain points.",
            f"Prioritise infrastructure improvements (seating, lighting, network) in '{lowest_sat_zone}' in the next budget cycle.",
            "Assign a dedicated Campus Experience Coordinator to the lowest-performing zone for a 90-day improvement sprint.",
        ],
        "metric": lowest_sat_val,
        "metric_label": f"Zone '{lowest_sat_zone}' satisfaction",
        "metric_format": "decimal",
        "projected_impact": round(min(25, gap_pct * 0.6), 1),
        "projected_impact_label": "Est. satisfaction uplift",
        "evidence": {
            "lowest_zone": lowest_sat_zone,
            "lowest_zone_sat": round(lowest_sat_val, 3),
            "campus_avg_sat": round(avg_sat, 3),
            "gap_pct": gap_pct,
            "zone_satisfaction": [
                {"zone": z, "avg_satisfaction": round(v, 3)}
                for z, v in by_zone_sat.items()
            ],
        },
    })

    # Intervention – Cross-Domain Compounding Effect
    if second_driver:
        interventions.append({
            "id": "sat-3",
            "category": "satisfaction",
            "priority": "medium",
            "title": f"Compound Gains: Co-Optimise '{top_driver_label}' + '{second_driver_label}'",
            "insight": (
                f"The top two satisfaction drivers — '{top_driver_label}' ({top_driver_importance:.1f}%) "
                f"and '{second_driver_label}' ({second_driver_importance:.1f}%) — together explain "
                f"{round(top_driver_importance + second_driver_importance, 1)}% of satisfaction variance. "
                f"Co-optimising both creates a compounding effect exceeding isolated improvements."
            ),
            "recommendations": [
                "Form a cross-functional 'Campus Experience Squad' spanning Facilities, Catering, and Transport teams.",
                "Run bi-weekly joint ops reviews tracking both metrics simultaneously to catch interaction effects.",
                f"A/B test combined interventions on '{lowest_sat_zone}' as a pilot zone before campus-wide rollout.",
            ],
            "metric": round(top_driver_importance + second_driver_importance, 1),
            "metric_label": "Combined driver importance (%)",
            "metric_format": "percent",
            "projected_impact": round(min(35, (top_driver_importance + second_driver_importance) * 0.35), 1),
            "projected_impact_label": "Est. compound satisfaction uplift",
            "evidence": {
                "top_driver_label": top_driver_label,
                "top_driver_importance_pct": top_driver_importance,
                "second_driver_label": second_driver_label,
                "second_driver_importance_pct": second_driver_importance,
                "combined_importance_pct": round(top_driver_importance + second_driver_importance, 1),
            },
        })

    return interventions


# ── Aggregated summary ────────────────────────────────────────────

def _compute_summary(interventions: list[dict]) -> dict[str, Any]:
    by_priority = {"critical": 0, "high": 0, "medium": 0}
    for item in interventions:
        p = item.get("priority", "medium")
        by_priority[p] = by_priority.get(p, 0) + 1

    total_projected_impact = round(
        sum(item.get("projected_impact", 0) for item in interventions), 1
    )

    return {
        "total_interventions": len(interventions),
        "critical": by_priority["critical"],
        "high": by_priority["high"],
        "medium": by_priority["medium"],
        "total_projected_impact": total_projected_impact,
        "domains": ["congestion", "food", "transport", "satisfaction"],
    }


# ── Public API ────────────────────────────────────────────────────

def get_strategic_interventions(df: pd.DataFrame) -> dict[str, Any]:
    """
    Return data-backed strategic interventions across all operational domains.

    Returned schema:
    {
        "summary": { total_interventions, critical, high, medium, ... },
        "interventions": [ { id, category, priority, title, insight,
                              recommendations, metric, metric_label,
                              projected_impact, evidence }, ... ]
    }
    """
    interventions: list[dict[str, Any]] = []
    interventions.extend(_congestion_interventions(df))
    interventions.extend(_food_interventions(df))
    interventions.extend(_transport_interventions(df))
    interventions.extend(_satisfaction_interventions(df))

    # Sort: critical → high → medium, then by projected_impact desc
    priority_order = {"critical": 0, "high": 1, "medium": 2}
    interventions.sort(
        key=lambda x: (priority_order.get(x["priority"], 3), -x.get("projected_impact", 0))
    )

    return {
        "summary": _compute_summary(interventions),
        "interventions": interventions,
    }
