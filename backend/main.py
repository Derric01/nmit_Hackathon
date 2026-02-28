"""
Smart Campus Operations Analytics – FastAPI application.

All routing and API wiring lives here.
Business logic is delegated to service modules.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import CORS_ORIGINS
from utils.preprocessing import get_processed_dataframe
from services.congestion_service import get_congestion_summary
from services.food_service import get_food_waste_analysis, get_waste_trend
from services.transport_service import get_transport_analysis
from services.satisfaction_service import get_satisfaction_impact
from services.simulation_service import run_simulation
from services.interventions_service import get_strategic_interventions
from models.train_models import get_food_demand_model, get_satisfaction_model


# ── Shared state ─────────────────────────────────────────────────
_df: pd.DataFrame | None = None


def _get_df() -> pd.DataFrame:
    """Return the processed DataFrame (loaded once at startup)."""
    global _df
    if _df is None:
        _df = get_processed_dataframe()
    return _df


# ── Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load data and train models at startup."""
    df = _get_df()
    # Warm the model caches
    get_food_demand_model(df)
    get_satisfaction_model(df)
    yield


# ── App ──────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Campus Operations Analytics",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic schemas ────────────────────────────────────────────

class SimulationRequest(BaseModel):
    """Input schema for the /simulate endpoint."""
    congestion_reduction: float = Field(
        0.0, ge=0, le=100, description="% reduction in congestion index"
    )
    delay_reduction: float = Field(
        0.0, ge=0, le=100, description="% reduction in delay minutes"
    )


class SimulationResponse(BaseModel):
    """Output schema for the /simulate endpoint."""
    congestion_reduction_pct: float
    delay_reduction_pct: float
    baseline_satisfaction: float
    projected_satisfaction: float
    improvement_pct: float


class KPIResponse(BaseModel):
    """Top-level KPI cards."""
    total_records: int
    avg_satisfaction: float
    avg_congestion_index: float
    avg_waste_percent: float
    avg_transport_utilization: float
    avg_delay_min: float
    food_model_r2: float
    satisfaction_model_r2: float


# ── Endpoints ────────────────────────────────────────────────────

@app.get("/kpis", response_model=KPIResponse)
async def kpis() -> KPIResponse:
    """Return high-level KPI metrics for the dashboard cards."""
    df = _get_df()
    food = get_food_demand_model(df)
    sat = get_satisfaction_model(df)

    return KPIResponse(
        total_records=len(df),
        avg_satisfaction=round(float(df["Satisfaction"].mean()), 2),
        avg_congestion_index=round(float(df["congestion_index"].mean()), 3),
        avg_waste_percent=round(float(df["waste_percent"].mean()), 3),
        avg_transport_utilization=round(float(df["transport_utilization"].mean()), 3),
        avg_delay_min=round(float(df["Avg_Delay_Min"].mean()), 1),
        food_model_r2=food["r2"],
        satisfaction_model_r2=sat["r2"],
    )


@app.get("/congestion")
async def congestion() -> dict[str, Any]:
    """Return congestion heatmap and bottleneck analysis."""
    return get_congestion_summary(_get_df())


@app.get("/food-analysis")
async def food_analysis() -> dict[str, Any]:
    """Return food waste analysis and waste trend."""
    df = _get_df()
    analysis = get_food_waste_analysis(df)
    analysis["waste_trend"] = get_waste_trend(df)

    # Add food demand model metrics
    food_model = get_food_demand_model(df)
    analysis["demand_model"] = {
        "r2": food_model["r2"],
        "mae": food_model["mae"],
    }
    return analysis


@app.get("/transport-analysis")
async def transport_analysis() -> dict[str, Any]:
    """Return transport utilisation vs delay scatter data."""
    return get_transport_analysis(_get_df())


@app.get("/satisfaction-impact")
async def satisfaction_impact() -> dict[str, Any]:
    """Return satisfaction model feature importances and metrics."""
    return get_satisfaction_impact(_get_df())


@app.post("/simulate", response_model=SimulationResponse)
async def simulate(req: SimulationRequest) -> SimulationResponse:
    """Run a what-if simulation and return projected satisfaction."""
    result = run_simulation(
        _get_df(),
        congestion_reduction_pct=req.congestion_reduction,
        delay_reduction_pct=req.delay_reduction,
    )
    return SimulationResponse(**result)


@app.get("/interventions")
async def interventions() -> dict[str, Any]:
    """Return data-backed strategic interventions across all operational domains."""
    return get_strategic_interventions(_get_df())
