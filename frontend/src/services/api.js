import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8001";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export const fetchKPIs = () => api.get("/kpis").then((r) => r.data);

export const fetchCongestion = () => api.get("/congestion").then((r) => r.data);

export const fetchFoodAnalysis = () =>
  api.get("/food-analysis").then((r) => r.data);

export const fetchTransportAnalysis = () =>
  api.get("/transport-analysis").then((r) => r.data);

export const fetchSatisfactionImpact = () =>
  api.get("/satisfaction-impact").then((r) => r.data);

export const runSimulation = (params) =>
  api
    .post("/simulate", {
      congestion_reduction: params.congestionReduction,
      delay_reduction: params.delayReduction,
    })
    .then((r) => r.data);

export const fetchInterventions = () =>
  api.get("/interventions").then((r) => r.data);

export default api;
