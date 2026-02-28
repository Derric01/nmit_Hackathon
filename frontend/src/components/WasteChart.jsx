import { motion } from "framer-motion";
import { Trash2, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default function WasteChart({ data }) {
  if (!data) return null;

  const byMeal = data.by_meal_type?.map((d) => ({
    meal: d.Meal_Type,
    waste: +(d.avg_waste_percent * 100).toFixed(1),
  }));

  const trend = data.waste_trend?.map((d) => ({
    date: d.date_str,
    waste: +(d.avg_waste_percent * 100).toFixed(1),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Trash2 className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <CardTitle>Food Waste Analysis</CardTitle>
                <CardDescription className="mt-1">Prepared vs sold mismatch across meal types and time</CardDescription>
              </div>
            </div>
            {data.demand_model && (
              <Badge variant="info" className="gap-1">
                R² {data.demand_model.r2}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Metric pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3" />
              Overall Waste:
              <span className="font-semibold text-foreground">{(data.overall_waste_percent * 100).toFixed(1)}%</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Total Qty:
              <span className="font-semibold text-foreground">{data.total_waste_qty?.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Waste by Meal Type */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Waste % by Meal Type
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byMeal} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" vertical={false} />
                  <XAxis
                    dataKey="meal"
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    axisLine={{ stroke: "#1e1e23" }}
                    tickLine={false}
                  />
                  <YAxis
                    unit="%"
                    tick={{ fontSize: 10, fill: "#52525b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="waste" name="Waste" fill="#f97316" radius={[6, 6, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Waste Trend */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Daily Waste Trend
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#52525b" }}
                    axisLine={{ stroke: "#1e1e23" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    unit="%"
                    tick={{ fontSize: 10, fill: "#52525b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <defs>
                    <linearGradient id="wasteAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="waste"
                    name="Waste"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#wasteAreaGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#ef4444", stroke: "#09090b", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
