import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrafficCone, UtensilsCrossed, Bus, Star,
  FlaskConical, ChevronRight, Menu, X, Radio, Zap, GraduationCap, Lightbulb,
} from "lucide-react";
import KPICards from "../components/KPICards";
import CongestionHeatmap from "../components/CongestionHeatmap";
import WasteChart from "../components/WasteChart";
import TransportScatter from "../components/TransportScatter";
import SatisfactionImpact from "../components/SatisfactionImpact";
import SimulationPanel from "../components/SimulationPanel";
import StrategicInterventions from "../components/StrategicInterventions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  fetchKPIs,
  fetchCongestion,
  fetchFoodAnalysis,
  fetchTransportAnalysis,
  fetchSatisfactionImpact,
  fetchInterventions,
} from "../services/api";

const NAV_ITEMS = [
  { id: "overview",      icon: LayoutDashboard, label: "Overview" },
  { id: "congestion",    icon: TrafficCone,     label: "Congestion" },
  { id: "food",          icon: UtensilsCrossed,  label: "Food Waste" },
  { id: "transport",     icon: Bus,             label: "Transport" },
  { id: "satisfaction",  icon: Star,            label: "Satisfaction" },
  { id: "simulation",    icon: FlaskConical,    label: "Simulation" },
  { id: "interventions", icon: Lightbulb,       label: "Interventions" },
];

export default function Dashboard({ onBack }) {
  const [kpis, setKpis] = useState(null);
  const [congestion, setCongestion] = useState(null);
  const [food, setFood] = useState(null);
  const [transport, setTransport] = useState(null);
  const [satisfaction, setSatisfaction] = useState(null);
  const [interventions, setInterventions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const [k, c, f, t, s, iv] = await Promise.all([
          fetchKPIs(),
          fetchCongestion(),
          fetchFoodAnalysis(),
          fetchTransportAnalysis(),
          fetchSatisfactionImpact(),
          fetchInterventions(),
        ]);
        setKpis(k);
        setCongestion(c);
        setFood(f);
        setTransport(t);
        setSatisfaction(s);
        setInterventions(iv);
      } catch (err) {
        console.error(err);
        setError("Failed to connect to analytics backend. Ensure the API is running on port 8001.");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const scrollTo = useCallback((id) => {
    setActiveNav(id);
    setSidebarOpen(false);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* ── Loading State ─────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Initialising analytics engine…</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Training ML models & processing 6,000 records</p>
        </div>
      </div>
    );
  }

  /* ── Error State ───────────────────────── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <X className="w-5 h-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Mobile Overlay ──────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────── */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-sidebar-bg flex flex-col border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-sidebar-border flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 cursor-pointer" onClick={onBack}>
            <GraduationCap className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground tracking-tight truncate">SmartCampus</p>
            <p className="text-[10px] text-muted-foreground leading-none">Operations Analytics</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em] px-2 mb-2">
            Analytics
          </p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer group relative",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-foreground"
                  )} strokeWidth={1.8} />
                  {item.label}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-muted-foreground/50">v1.0 · Decision Intelligence</p>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────── */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
              <Radio className="w-3 h-3 animate-pulse" />
              Live · {kpis?.total_records?.toLocaleString()} records
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 lg:px-6 py-6 max-w-[1320px] w-full mx-auto">
          {/* Header */}
          <motion.div
            id="section-overview"
            className="mb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Campus Operations Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">
              Real-time analytics across congestion, food services, transportation,
              and satisfaction — powered by ML-driven insights.
            </p>
          </motion.div>

          {/* KPIs */}
          <section className="mb-6">
            <KPICards data={kpis} />
          </section>

          <Separator className="mb-6" />

          {/* Congestion */}
          <section id="section-congestion" className="mb-6 scroll-mt-18">
            <CongestionHeatmap data={congestion} />
          </section>

          {/* Food */}
          <section id="section-food" className="mb-6 scroll-mt-18">
            <WasteChart data={food} />
          </section>

          {/* Transport + Satisfaction side by side on large screens */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
            <section id="section-transport" className="scroll-mt-18">
              <TransportScatter data={transport} />
            </section>
            <section id="section-satisfaction" className="scroll-mt-18">
              <SatisfactionImpact data={satisfaction} />
            </section>
          </div>

          {/* Simulation */}
          <section id="section-simulation" className="mb-6 scroll-mt-18">
            <SimulationPanel />
          </section>

          <Separator className="mb-6" />

          {/* Strategic Interventions */}
          <section id="section-interventions" className="mb-8 scroll-mt-18">
            <StrategicInterventions data={interventions} />
          </section>

          <footer className="text-center py-4 text-[11px] text-muted-foreground/40">
            Smart Campus Operations Analytics · Internal Decision Intelligence Platform · {new Date().getFullYear()}
          </footer>
        </main>
      </div>
    </div>
  );
}
