import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, TrafficCone, UtensilsCrossed, Bus, Star,
  TrendingUp, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Circle, BarChart2, Target, Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ── Constants ──────────────────────────────────────────────────── */

const CATEGORY_META = {
  congestion: {
    label: "Congestion & Mobility",
    Icon: TrafficCone,
    colour: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    accent: "#f97316",
  },
  food: {
    label: "Food & Waste",
    Icon: UtensilsCrossed,
    colour: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    accent: "#10b981",
  },
  transport: {
    label: "Transport",
    Icon: Bus,
    colour: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    accent: "#3b82f6",
  },
  satisfaction: {
    label: "Satisfaction",
    Icon: Star,
    colour: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    accent: "#8b5cf6",
  },
};

const PRIORITY_META = {
  critical: {
    label: "Critical",
    Icon: AlertTriangle,
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-500",
    ring: "ring-red-500/20",
  },
  high: {
    label: "High",
    Icon: TrendingUp,
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
  },
  medium: {
    label: "Medium",
    Icon: Circle,
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    dot: "bg-sky-400",
    ring: "ring-sky-500/20",
  },
};

const FILTER_TABS = [
  { id: "all", label: "All", Icon: Layers },
  { id: "congestion", label: "Congestion", Icon: TrafficCone },
  { id: "food", label: "Food", Icon: UtensilsCrossed },
  { id: "transport", label: "Transport", Icon: Bus },
  { id: "satisfaction", label: "Satisfaction", Icon: Star },
];

/* ── Helpers ────────────────────────────────────────────────────── */

function formatMetric(value, format) {
  if (value === undefined || value === null) return "—";
  if (format === "percent") return `${Number(value).toFixed(1)}%`;
  if (format === "integer") return Number(value).toLocaleString();
  return Number(value).toFixed(2);
}

/* ── Summary Strip ──────────────────────────────────────────────── */

function SummaryStrip({ summary }) {
  const chips = [
    {
      label: "Total Interventions",
      value: summary.total_interventions,
      colour: "text-foreground",
      Icon: Lightbulb,
    },
    {
      label: "Critical",
      value: summary.critical,
      colour: "text-red-400",
      Icon: AlertTriangle,
    },
    {
      label: "High Priority",
      value: summary.high,
      colour: "text-amber-400",
      Icon: TrendingUp,
    },
    {
      label: "Medium Priority",
      value: summary.medium,
      colour: "text-sky-400",
      Icon: Circle,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {chips.map(({ label, value, colour, Icon }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card/50 px-4 py-3 flex items-center gap-3"
        >
          <Icon className={cn("w-4 h-4 flex-shrink-0", colour)} strokeWidth={1.8} />
          <div>
            <p className={cn("text-xl font-bold leading-none", colour)}>{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Evidence Panel ─────────────────────────────────────────────── */

function EvidencePanel({ evidence }) {
  const entries = Object.entries(evidence).filter(
    ([, v]) => v !== null && v !== undefined && !Array.isArray(v) && typeof v !== "object"
  );
  const tableEntries = Object.entries(evidence).filter(([, v]) => Array.isArray(v));

  if (entries.length === 0 && tableEntries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 mb-2">
          Supporting Evidence
        </p>
        {entries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {entries.map(([key, val]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-[11px] text-muted-foreground border border-border/50"
              >
                <span className="font-medium text-foreground/70">
                  {key.replace(/_/g, " ")}:
                </span>{" "}
                {typeof val === "number" ? Number(val).toLocaleString() : String(val)}
              </span>
            ))}
          </div>
        )}
        {tableEntries.map(([key, rows]) => {
          if (!rows || rows.length === 0) return null;
          const cols = Object.keys(rows[0]);
          return (
            <div key={key} className="mb-3">
              <p className="text-[10px] text-muted-foreground/50 mb-1 capitalize">
                {key.replace(/_/g, " ")}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr>
                      {cols.map((c) => (
                        <th
                          key={c}
                          className="text-left px-2 py-1 border-b border-border/40 text-muted-foreground/60 font-medium capitalize"
                        >
                          {c.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border/20">
                        {cols.map((c) => (
                          <td key={c} className="px-2 py-1 text-muted-foreground">
                            {typeof row[c] === "number"
                              ? Number(row[c]).toLocaleString(undefined, { maximumFractionDigits: 3 })
                              : String(row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Intervention Card ──────────────────────────────────────────── */

function InterventionCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_META[item.category] || CATEGORY_META.satisfaction;
  const pri = PRIORITY_META[item.priority] || PRIORITY_META.medium;
  const { Icon: CatIcon } = cat;
  const { Icon: PriIcon } = pri;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
    >
      <Card
        className={cn(
          "border transition-all duration-200 hover:shadow-md",
          cat.border,
          "bg-card"
        )}
      >
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* Category icon */}
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cat.bg)}>
                <CatIcon className={cn("w-4 h-4", cat.colour)} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                <p className={cn("text-[11px] font-medium mt-0.5", cat.colour)}>{cat.label}</p>
              </div>
            </div>
            {/* Priority badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0",
                pri.className
              )}
            >
              <PriIcon className="w-2.5 h-2.5" strokeWidth={2} />
              {pri.label}
            </span>
          </div>

          {/* Key Metric + Projected Impact */}
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-muted/40 border border-border/50 px-3 py-1.5 flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.8} />
              <div>
                <p className={cn("text-base font-bold leading-none", cat.colour)}>
                  {formatMetric(item.metric, item.metric_format)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.metric_label}</p>
              </div>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" strokeWidth={1.8} />
              <div>
                <p className="text-base font-bold leading-none text-emerald-400">
                  ↓ {item.projected_impact}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.projected_impact_label}</p>
              </div>
            </div>
          </div>

          {/* Insight */}
          <p className="text-[12px] text-muted-foreground italic leading-relaxed mb-3 border-l-2 pl-3"
            style={{ borderColor: cat.accent + "60" }}>
            {item.insight}
          </p>

          {/* Recommendations */}
          <div className="space-y-1.5 mb-3">
            {item.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  style={{ color: cat.accent }}
                  strokeWidth={2}
                />
                <p className="text-[12px] text-foreground/80 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>

          {/* Expand evidence toggle */}
          {item.evidence && Object.keys(item.evidence).length > 0 && (
            <>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors mt-1"
              >
                {expanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {expanded ? "Hide" : "View"} supporting data
              </button>
              <AnimatePresence>
                {expanded && <EvidencePanel evidence={item.evidence} />}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export default function StrategicInterventions({ data }) {
  const [activeFilter, setActiveFilter] = useState("all");

  if (!data) {
    return (
      <Card className="border border-border">
        <CardContent className="p-6 animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const { summary, interventions } = data;

  const filtered =
    activeFilter === "all"
      ? interventions
      : interventions.filter((i) => i.category === activeFilter);

  const countByCategory = (id) =>
    interventions.filter((i) => i.category === id).length;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Strategic Interventions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Data-backed recommendations to improve operational efficiency across all campus domains
          </p>
        </div>
      </div>

      {/* Summary Strip */}
      <SummaryStrip summary={summary} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map(({ id, label, Icon: TabIcon }) => {
          const isActive = activeFilter === id;
          const count = id === "all" ? summary.total_interventions : countByCategory(id);
          return (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0",
                isActive
                  ? "bg-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <TabIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {label}
              <span
                className={cn(
                  "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground/60"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Separator />

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No interventions found for this filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((item, i) => (
            <InterventionCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground/40 text-center pt-2">
        Recommendations derived from {summary.total_interventions} data-driven analyses across{" "}
        {summary.domains.length} operational domains · Projected impacts are model estimates
      </p>
    </div>
  );
}
