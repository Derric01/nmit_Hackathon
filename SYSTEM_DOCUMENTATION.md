# Smart Campus Operations Analytics Dashboard
## Complete System Documentation

---

## Table of Contents

1. [Problem Statement & Solutions](#1-problem-statement--solutions)
2. [How the Application Works](#2-how-the-application-works)
3. [Glossary of Terms](#3-glossary-of-terms)
4. [Data Pipeline — Step by Step](#4-data-pipeline--step-by-step)
5. [Backend Architecture](#5-backend-architecture)
6. [Machine Learning Models](#6-machine-learning-models)
7. [API Endpoints](#7-api-endpoints)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Dashboard Sections Explained](#9-dashboard-sections-explained)
10. [Data Flow Diagram](#10-data-flow-diagram)

---

## 1. Problem Statement & Solutions

### Background
The campus administration faces **operational inefficiencies** despite stable visitor inflow. High footfall does NOT consistently translate to higher satisfaction. Food waste, transportation delays, and congestion vary unpredictably across zones and time slots.

---

### Q1 — Are high footfall zones operating efficiently or creating congestion bottlenecks?

**Answer from the codebase:**

The system computes a **congestion_index** for every record:

```
congestion_index = Footfall / zone_capacity
```

Where `zone_capacity` is a fixed capacity per zone (e.g., Library = 300, FoodCourt = 500, etc.). A congestion_index > 1.0 indicates the zone is **over capacity** — meaning high footfall is NOT being handled efficiently but is actively creating a bottleneck.

The `congestion_service.py` flags any zone × time-slot combination where the average congestion_index **≥ 0.85** as a **bottleneck**. The `/congestion` endpoint returns:
- The overall average congestion_index across all zones and time slots
- The single most congested zone (peak zone)
- The single most congested time slot (peak slot)
- A count of bottleneck combinations

**Conclusion:** The dashboard directly identifies which zones are bottleneck zones versus efficient zones by visualising the full Zone × Time Slot heatmap. Cells coloured red/orange are congestion bottlenecks; green cells are running efficiently.

---

### Q2 — Which meal types and time slots generate maximum food waste?

**Answer from the codebase:**

The system computes **waste_percent** per record:

```
waste_percent = (Prepared_Qty - Orders) / Prepared_Qty
```

`food_service.py` then aggregates this by:
- **Meal_Type** → shows which meal type (Breakfast, Lunch, Dinner, Snacks) has the highest average waste percentage and total wasted quantity
- **Zone** → shows which campus zone wastes the most food
- **Waste Trend** → groups records by Time_Slot to show when during the day waste peaks

The `/food-analysis` endpoint returns `by_meal_type` and `by_zone` breakdowns alongside a `waste_trend` array showing average waste_percent per time slot.

**Conclusion:** By comparing `avg_waste_percent` and `total_waste` across meal types and time slots, administrators can immediately see — for example — that late-night snacks may have 40% waste because demand drops while preparation quantities remain constant.

---

### Q3 — Does congestion directly reduce satisfaction levels?

**Answer from the codebase:**

Yes — and this is quantified with ML. The **Satisfaction Prediction Model** (`RandomForestRegressor`) uses `congestion_index` as one of its four input features:

```
Features → congestion_index, Avg_Delay_Min, waste_percent, Response_Time_hr
Target   → Satisfaction (1–5 scale)
```

The model returns **feature importances** — a percentage showing how much each variable explains satisfaction variance. If `congestion_index` has a high importance score, it means congestion directly drives satisfaction down.

The **What-If Simulation** (`/simulate`) makes this concrete: if you reduce `congestion_index` by X%, the model re-predicts satisfaction across all 6,000 records and shows you the projected improvement percentage.

**Conclusion:** The feature importance chart in the "Satisfaction" section directly answers this question. A high importance for `congestion_index` confirms it is a primary driver of dissatisfaction.

---

### Q4 — Are transportation delays caused by underutilisation or overcrowding?

**Answer from the codebase:**

The system computes **transport_utilization** per record:

```
transport_utilization = Passengers / Bus_Capacity
```

`transport_service.py` then:
1. Calculates the percentage of records where `transport_utilization > 1.0` (overcrowded trips) — stored as `overcrowded_pct`
2. Returns a **scatter plot dataset** pairing `utilization` vs `delay` for up to 500 sampled records by zone and time slot

The scatter plot on the frontend (`TransportScatter.jsx`) lets administrators visually see whether high-delay records cluster at **high utilization** (overcrowding → delays) or at **low utilization** (underuse → inefficiency).

**Conclusion:** If the scatter shows a positive correlation (high utilization = high delay), the cause is overcrowding. If delays appear even at low utilization, the problem is scheduling or route inefficiency, not passenger load.

---

### Q5 — How does service response time influence user experience and ratings?

**Answer from the codebase:**

`Response_Time_hr` (hours taken to resolve a service request) is one of the four features in the **Satisfaction Prediction Model**. Its feature importance score tells us the fraction of satisfaction variance it explains.

The simulation panel allows testing: "If I reduce response time (via the `delay_reduction` proxy), how much does predicted satisfaction improve?"

**Conclusion:** The feature importance bar chart directly quantifies the impact of `Response_Time_hr` on `Satisfaction`. A high importance means faster service response has the biggest lever on satisfaction scores.

---

### Q6 — Which zones require better resource allocation for optimal performance?

**Answer from the codebase:**

Three separate analyses converge to answer this:

1. **Congestion Heatmap** — identifies zones with persistently high `congestion_index` across multiple time slots, indicating they need higher capacity or crowd dispersal measures
2. **Food Analysis by Zone** — `food_service.py` returns `by_zone` food waste data, identifying zones where food prep quantities need better calibration
3. **Transport by Zone** — `transport_service.py` returns per-zone utilization and delay averages, flagging zones underserved by transport

A zone appearing in all three analyses as a problem area is a clear candidate for **priority resource reallocation**.

---

## 2. How the Application Works

The system is a **full-stack data analytics platform** split into two independent servers that communicate over HTTP:

```
[Excel Dataset]
      ↓
[Python Backend — FastAPI on port 8000/8001]
  • Loads & preprocesses the dataset on startup
  • Trains ML models (cached in memory)
  • Exposes REST API endpoints
      ↓  HTTP/JSON
[React Frontend — Vite dev server on port 5173]
  • Fetches data from all API endpoints on load
  • Renders interactive charts and KPI cards
  • Sends simulation requests and displays results
```

### Startup Sequence

1. Backend starts (`uvicorn main:app`)
2. `lifespan()` hook fires:
   - `get_processed_dataframe()` loads the Excel file, cleans it, and engineers all derived columns
   - `get_food_demand_model()` trains a LinearRegression model and caches it
   - `get_satisfaction_model()` trains a RandomForestRegressor and caches it
3. FastAPI is now ready to serve requests
4. Frontend starts (`npm run dev`)
5. User opens the browser, sees the Landing Page
6. User clicks "Enter Dashboard"
7. Dashboard fires **five parallel API calls** using `Promise.all()`:
   - `GET /kpis`
   - `GET /congestion`
   - `GET /food-analysis`
   - `GET /transport-analysis`
   - `GET /satisfaction-impact`
8. All responses are stored in React state and rendered into charts
9. User can interact with the **Simulation Panel** — adjusting sliders and posting to `POST /simulate` to get projected satisfaction numbers

---

## 3. Glossary of Terms

| Term | Definition |
|---|---|
| **Footfall** | The number of people entering / present in a campus zone during a given time period |
| **Zone** | A named physical area on campus (Library, Sports, Hostel, FoodCourt, Academic) |
| **Time_Slot** | The part of the day in which the observation was recorded (Morning, Afternoon, Evening, Night) |
| **zone_capacity** | Maximum number of people a zone is designed to accommodate comfortably |
| **congestion_index** | `Footfall / zone_capacity`. Values < 1 = under capacity; > 1 = overcrowded |
| **Bottleneck** | A zone × time-slot combination where the average congestion_index ≥ 0.85 |
| **Prepared_Qty** | Number of food portions prepared by the canteen/cafeteria for a given period |
| **Orders** | Actual food portions sold (demand realised) |
| **Waste_Qty** | Absolute quantity of food wasted = `Prepared_Qty − Orders` |
| **waste_percent** | `(Prepared_Qty - Orders) / Prepared_Qty` — the fraction of prepared food that went unsold |
| **Meal_Type** | Category of food offering (Breakfast, Lunch, Dinner, Snacks) |
| **Passengers** | Number of people who boarded campus transport vehicles in an observation period |
| **Bus_Capacity** | Maximum seating/standing capacity of the bus on a given route |
| **transport_utilization** | `Passengers / Bus_Capacity`. > 1 = overcrowded; < 0.5 = underutilised |
| **Avg_Delay_Min** | Average delay in minutes experienced by campus transport on a route / time slot |
| **Response_Time_hr** | Average time in hours taken by campus services (maintenance, admin) to respond to a complaint or request |
| **Satisfaction** | Overall visitor/student satisfaction score on a numerical scale (typically 1–5) |
| **Security_Incidents** | Count of security events (thefts, altercations) recorded in the zone/period |
| **KPI** | Key Performance Indicator — a single headline metric summarising performance |
| **R² (R-squared)** | Model accuracy metric ranging 0–1. A score of 0.85 means the model explains 85% of the variance in the target variable |
| **MAE** | Mean Absolute Error — the average magnitude of prediction errors in the same units as the target |
| **Feature Importance** | How much a given input variable contributes to the model's predictions. Expressed as a fraction of total importance (sums to 1) |
| **What-If Simulation** | An interactive scenario where the user hypothetically reduces congestion or delays and the ML model projects the resulting change in satisfaction |
| **LinearRegression** | A statistical model that finds the best-fit straight line relationship between inputs and a continuous output |
| **RandomForestRegressor** | An ensemble of many decision trees that votes on a predicted numeric value. More robust and accurate than a single tree |
| **Train/Test Split** | Dividing the dataset into a training portion (model learns from this) and a testing portion (model is evaluated on unseen data) |
| **Label Encoding** | Converting a categorical text column (e.g., "Morning") into a numeric code (e.g., 2) so ML models can process it |
| **LRU Cache / In-memory Cache** | The trained model is stored in Python memory after the first training run; subsequent API calls reuse the cached model without retraining |
| **CORS** | Cross-Origin Resource Sharing — a browser security rule. The backend is configured to allow the frontend (different port) to call its APIs |
| **FastAPI** | A modern Python web framework for building REST APIs with automatic documentation |
| **Vite** | A fast JavaScript build tool and development server used for the React frontend |
| **Pydantic** | Python library for data validation. Used to define strict input/output schemas for API endpoints |
| **Axios** | JavaScript HTTP client used by the frontend to make requests to the backend API |
| **Recharts** | React charting library used to render interactive bar charts, scatter plots, and line charts |
| **Framer Motion** | React animation library used for smooth page transitions and component animations |
| **Tailwind CSS** | Utility-first CSS framework used for all styling in the frontend |
| **shadcn/ui** | Pre-built Reac UI component library (Cards, Buttons, Sliders, Badges, etc.) |

---

## 4. Data Pipeline — Step by Step

```
backend/data/dataset.xlsx
         │
         ▼
load_raw_dataframe()
  • pd.read_excel() reads ~6,000 rows
         │
         ▼
clean_dataframe()
  • Security_Incidents: coerce strings to numeric, fill NaN → 0
  • All numeric columns: fill NaN with column median
  • Avg_Delay_Min: clip negative values to 0
         │
         ▼
add_engineered_features()
  • zone_capacity  = ZONE_CAPACITY[Zone]  (dict lookup)
  • congestion_index = Footfall / zone_capacity
  • waste_percent = (Prepared_Qty - Orders) / Prepared_Qty
  • transport_utilization = Passengers / Bus_Capacity
  • zone_encoded = integer label for Zone
  • time_slot_encoded = integer label for Time_Slot
         │
         ▼
get_processed_dataframe()  ← single cached DataFrame used by ALL services
```

---

## 5. Backend Architecture

```
backend/
├── main.py              ← FastAPI app, endpoint definitions, CORS, lifespan hook
├── config.py            ← Paths (DATA_DIR, DATASET_PATH), constants (ZONE_CAPACITY, RANDOM_STATE)
├── requirements.txt     ← Python dependencies
│
├── data/
│   └── dataset.xlsx     ← Source dataset (6,000 rows)
│
├── utils/
│   └── preprocessing.py ← Data loading, cleaning, feature engineering
│
├── models/
│   └── train_models.py  ← ML model training and in-memory caching
│
└── services/
    ├── congestion_service.py   ← Heatmap aggregation, bottleneck detection
    ├── food_service.py         ← Waste analysis by meal type, zone, time
    ├── transport_service.py    ← Utilization vs delay analysis, scatter data
    ├── satisfaction_service.py ← Feature importances, predicted vs actual
    └── simulation_service.py  ← What-if scenario engine
```

### Design Principle
Each service receives the **already-processed DataFrame** as a parameter. No service reads from disk. The DataFrame is loaded once at startup (`main.py → lifespan`) and shared globally. This makes every API response fast (pure in-memory computation).

---

## 6. Machine Learning Models

### Model 1 — Food Demand Prediction (LinearRegression)

| Attribute | Value |
|---|---|
| **Algorithm** | `sklearn.linear_model.LinearRegression` |
| **Input Features** | `Footfall`, `zone_encoded`, `time_slot_encoded` |
| **Target** | `Orders` (number of food portions sold) |
| **Purpose** | Predict how many orders a zone will need given footfall and time of day — enabling smarter prep quantities to reduce waste |
| **Metric** | R² and MAE on held-out test set |
| **Used in** | `/food-analysis` endpoint → `demand_model.r2` and `demand_model.mae` in KPI cards |

**Interpretation:** A high R² (e.g., 0.82) means footfall and time slot reliably predict orders. This lets admins calibrate `Prepared_Qty` to forecasted `Orders` and cut `waste_percent`.

---

### Model 2 — Satisfaction Prediction (RandomForestRegressor)

| Attribute | Value |
|---|---|
| **Algorithm** | `sklearn.ensemble.RandomForestRegressor(n_estimators=150, max_depth=12)` |
| **Input Features** | `congestion_index`, `Avg_Delay_Min`, `waste_percent`, `Response_Time_hr` |
| **Target** | `Satisfaction` (visitor satisfaction score) |
| **Purpose** | Quantify exactly how much each operational factor reduces satisfaction, and power the What-If Simulation |
| **Metric** | R² and MAE on held-out test set |
| **Used in** | `/satisfaction-impact` (feature importances) and `/simulate` (projected satisfaction) |

**Feature Importance Interpretation:**

```
e.g.  congestion_index  → 0.42  (42% of satisfaction variance)
      Avg_Delay_Min      → 0.28  (28%)
      Response_Time_hr   → 0.20  (20%)
      waste_percent      → 0.10  (10%)
```
This tells management: "Fix congestion first, then transport delays."

---

### Why These Two Models?

| Challenge | Model |
|---|---|
| How much food to prepare? | LinearRegression — demand is roughly linear with footfall |
| What drives satisfaction? | RandomForest — satisfaction depends on multiple non-linear interactions between operational metrics |

---

## 7. API Endpoints

| Method | Path | Description | Returns |
|---|---|---|---|
| `GET` | `/kpis` | Headline KPI cards for the overview page | `total_records`, `avg_satisfaction`, `avg_congestion_index`, `avg_waste_percent`, `avg_transport_utilization`, `avg_delay_min`, model R² scores |
| `GET` | `/congestion` | Zone × time-slot heatmap data | `heatmap[]`, `bottlenecks[]`, `overall_avg_congestion`, `most_congested_zone`, `most_congested_time_slot`, `bottleneck_count` |
| `GET` | `/food-analysis` | Food waste breakdown | `overall_waste_percent`, `total_waste_qty`, `by_meal_type[]`, `by_zone[]`, `waste_trend[]`, `demand_model{r2, mae}` |
| `GET` | `/transport-analysis` | Transport utilization vs delay | `avg_utilization`, `avg_delay_min`, `max_delay_min`, `overcrowded_pct`, `scatter[]` |
| `GET` | `/satisfaction-impact` | Model feature importances | `r2_score`, `mae`, `feature_importances[]`, `comparison[]` (predicted vs actual) |
| `POST` | `/simulate` | What-if scenario | `baseline_satisfaction`, `projected_satisfaction`, `improvement_pct`, `congestion_reduction_pct`, `delay_reduction_pct` |

### Simulate Request Body
```json
{
  "congestion_reduction": 30,
  "delay_reduction": 20
}
```
→ "If we reduced congestion_index by 30% and Avg_Delay_Min by 20%, what would satisfaction be?"

---

## 8. Frontend Architecture

```
frontend/src/
├── main.jsx          ← React entry point, mounts <App />
├── App.jsx           ← Root component, toggles between LandingPage and Dashboard
├── index.css         ← Global CSS + Tailwind base
│
├── pages/
│   ├── LandingPage.jsx  ← Animated intro screen with rotating headline words
│   └── Dashboard.jsx    ← Main analytics shell with sidebar navigation
│
├── components/
│   ├── KPICards.jsx        ← 6 headline metric cards at the top of the overview
│   ├── CongestionHeatmap.jsx  ← Zone × Time Slot colour-coded grid table
│   ├── WasteChart.jsx      ← Bar charts for food waste by meal type and zone
│   ├── TransportScatter.jsx   ← Scatter plot: utilization (x) vs delay (y)
│   ├── SatisfactionImpact.jsx ← Feature importance bars + predicted vs actual
│   ├── SimulationPanel.jsx    ← Sliders + "Run Simulation" button + results
│   └── ui/               ← shadcn/ui primitives (Card, Button, Slider, Badge…)
│
├── services/
│   └── api.js          ← All Axios calls to the backend API
│
└── lib/
    └── utils.js        ← cn() helper for conditional Tailwind class merging
```

### State Management
There is **no global state store** (no Redux/Zustand). All API data is fetched once on `Dashboard` mount via `useEffect + Promise.all()` and stored in local `useState` variables:
- `kpis`, `congestion`, `food`, `transport`, `satisfaction` — each holds the full API response
- These are passed as props down to the relevant chart component

---

## 9. Dashboard Sections Explained

### Overview (KPI Cards)
Six headline numbers computed from the full dataset:
- **Total Records** — total observations in the dataset
- **Avg Satisfaction** — mean satisfaction score (scale 1–5)
- **Avg Congestion Index** — how frequently zones are near/over capacity
- **Avg Waste %** — what fraction of food prepared is being wasted
- **Avg Transport Utilization** — how full buses are on average
- **Avg Delay (min)** — average transport delay in minutes

Also shows the R² accuracy scores of both ML models.

---

### Congestion Section
- **Congestion Heatmap** — a 5-zone × 4-time-slot grid where each cell shows the mean congestion_index. Cell colour goes from green (low) → amber → orange → red (bottleneck)
- **Metric Pills** show: overall average, the single worst zone, and the single worst time slot
- A **Bottleneck Badge** appears if any cells exceed the 0.85 threshold

---

### Food Waste Section
- **Bar Chart by Meal Type** — which meal category generates the most waste percentage
- **Bar Chart by Zone** — which physical area of campus wastes the most
- **Waste Trend** — line showing average waste_percent across time slots (Morning → Afternoon → Evening → Night)
- Helps answer: "Should we prepare fewer Evening snacks?"

---

### Transport Section
- **Scatter Plot** — each point is one observation; X = transport_utilization, Y = delay in minutes, coloured by zone
- Cluster patterns reveal: "Delays happen when buses are overcrowded (x > 1)" or "Delays are random regardless of load"
- **KPI Pills** show: avg utilization, avg delay, max delay, % of trips that were overcrowded

---

### Satisfaction Section
- **Feature Importance Chart** — horizontal bar chart showing how much each of the 4 operational metrics drives satisfaction scores (sums to 100%)
- **Predicted vs Actual Scatter** — dots showing how well the RandomForest model predicts real satisfaction values (tight cluster around the diagonal = good model)
- **Model Metrics** — R² and MAE displayed as badges

---

### Simulation Section
- **Two Sliders** — "Congestion Reduction (%)" and "Delay Reduction (%)"  
  e.g., slide both to 40% to ask: "What if we could cut congestion and delays by 40%?"
- **Run Simulation** — posts to `POST /simulate`; the model applies the hypothetical reductions to all 6,000 records and returns the projected average satisfaction
- **Results Panel** shows:
  - Baseline (current) satisfaction
  - Projected (improved) satisfaction
  - Delta / improvement percentage
  - Whether the change is positive (green ↑) or negative (red ↓)

---

## 10. Data Flow Diagram

```
                         ┌─────────────────────────────┐
                         │       dataset.xlsx           │
                         │   (6,000 campus records)     │
                         └──────────────┬──────────────┘
                                        │ pd.read_excel
                                        ▼
                         ┌─────────────────────────────┐
                         │     preprocessing.py         │
                         │  clean → feature-engineer    │
                         │  congestion_index            │
                         │  waste_percent               │
                         │  transport_utilization       │
                         │  zone_encoded                │
                         │  time_slot_encoded           │
                         └──────────────┬──────────────┘
                                        │ single DataFrame
                       ┌────────────────┼───────────────────┐
                       ▼                ▼                   ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
              │ Services     │  │ ML Models    │  │  Services        │
              │ congestion   │  │ LinearReg    │  │  food / transport│
              │ satisfaction │  │ RandomForest │  │  simulation      │
              └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘
                     └──────────────────┴───────────────────┘
                                        │ JSON responses
                                        ▼
                         ┌─────────────────────────────┐
                         │     FastAPI (main.py)        │
                         │  GET /kpis                   │
                         │  GET /congestion             │
                         │  GET /food-analysis          │
                         │  GET /transport-analysis     │
                         │  GET /satisfaction-impact    │
                         │  POST /simulate              │
                         └──────────────┬──────────────┘
                                        │ HTTP + JSON (port 8000)
                                        ▼
                         ┌─────────────────────────────┐
                         │   React Frontend (Vite)      │
                         │   services/api.js (Axios)    │
                         │   Promise.all([5 requests])  │
                         └──────────────┬──────────────┘
                                        │ props
                       ┌────────────────┼──────────────────┐
                       ▼                ▼                  ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
              │  KPICards    │  │ Heatmap      │  │  Simulation      │
              │  WasteChart  │  │ Transport    │  │  Satisfaction    │
              │  Scatter     │  │ Feature Imp  │  │  Panel           │
              └──────────────┘  └──────────────┘  └──────────────────┘
```

---

## Quick Reference — Key Formulas

| Metric | Formula |
|---|---|
| Congestion Index | $\text{congestion\_index} = \dfrac{\text{Footfall}}{\text{zone\_capacity}}$ |
| Waste Percent | $\text{waste\_percent} = \dfrac{\text{Prepared\_Qty} - \text{Orders}}{\text{Prepared\_Qty}}$ |
| Transport Utilization | $\text{transport\_utilization} = \dfrac{\text{Passengers}}{\text{Bus\_Capacity}}$ |
| Bottleneck Threshold | $\text{congestion\_index} \geq 0.85$ |
| Overcrowded Transport | $\text{transport\_utilization} > 1.0$ |

---

*Generated: 2026-02-28 | Smart Campus Operations Analytics Dashboard*
