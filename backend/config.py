"""
Application configuration for Smart Campus Operations Analytics.
"""
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────
BASE_DIR: Path = Path(__file__).resolve().parent
DATA_DIR: Path = BASE_DIR / "data"
DATASET_PATH: Path = DATA_DIR / "dataset.xlsx"

# ── Zone capacity mapping (max safe occupancy) ───────────────────
ZONE_CAPACITY: dict[str, int] = {
    "Library": 200,
    "Sports": 250,
    "Hostel": 300,
    "FoodCourt": 150,
    "Academic": 250,
}

# ── CORS origins allowed ─────────────────────────────────────────
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# ── ML defaults ──────────────────────────────────────────────────
TEST_SIZE: float = 0.2
RANDOM_STATE: int = 42
