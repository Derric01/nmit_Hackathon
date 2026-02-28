import { motion } from "framer-motion";
import {
  BarChart3,
  Star,
  TrafficCone,
  Trash2,
  Bus,
  Clock,
  UtensilsCrossed,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    key: "total_records",
    label: "Total Records",
    icon: BarChart3,
    color: "blue",
    accent: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-500/10 text-blue-400",
    fmt: (v) => v?.toLocaleString(),
  },
  {
    key: "avg_satisfaction",
    label: "Avg Satisfaction",
    icon: Star,
    color: "amber",
    accent: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/10 text-amber-400",
    fmt: (v) => v?.toFixed(2),
    suffix: "/ 5.0",
  },
  {
    key: "avg_congestion_index",
    label: "Congestion Index",
    icon: TrafficCone,
    color: "red",
    accent: "from-red-500/20 to-red-600/5",
    iconBg: "bg-red-500/10 text-red-400",
    fmt: (v) => v?.toFixed(3),
  },
  {
    key: "avg_waste_percent",
    label: "Food Waste",
    icon: Trash2,
    color: "orange",
    accent: "from-orange-500/20 to-orange-600/5",
    iconBg: "bg-orange-500/10 text-orange-400",
    fmt: (v) => (v * 100)?.toFixed(1) + "%",
  },
  {
    key: "avg_transport_utilization",
    label: "Transport Util.",
    icon: Bus,
    color: "cyan",
    accent: "from-cyan-500/20 to-cyan-600/5",
    iconBg: "bg-cyan-500/10 text-cyan-400",
    fmt: (v) => v?.toFixed(3),
  },
  {
    key: "avg_delay_min",
    label: "Avg Delay",
    icon: Clock,
    color: "slate",
    accent: "from-zinc-500/20 to-zinc-600/5",
    iconBg: "bg-zinc-500/10 text-zinc-400",
    fmt: (v) => v?.toFixed(1),
    suffix: "min",
  },
  {
    key: "food_model_r2",
    label: "Food Model R²",
    icon: UtensilsCrossed,
    color: "emerald",
    accent: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/10 text-emerald-400",
    fmt: (v) => v?.toFixed(4),
  },
  {
    key: "satisfaction_model_r2",
    label: "Satisfaction R²",
    icon: Target,
    color: "sky",
    accent: "from-sky-500/20 to-sky-600/5",
    iconBg: "bg-sky-500/10 text-sky-400",
    fmt: (v) => v?.toFixed(4),
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function KPICards({ data }) {
  if (!data) return null;

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {CARDS.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.key}
            variants={item}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border bg-card p-4",
              "hover:border-border/80 transition-all duration-300"
            )}
          >
            {/* Subtle gradient glow on top */}
            <div className={cn(
              "absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              c.accent
            )} />

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {c.label}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-foreground tracking-tight">
                    {c.fmt(data[c.key])}
                  </span>
                  {c.suffix && (
                    <span className="text-xs text-muted-foreground font-medium">{c.suffix}</span>
                  )}
                </div>
              </div>
              <div className={cn("flex-shrink-0 rounded-lg p-2", c.iconBg)}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
