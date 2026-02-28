import { motion } from "framer-motion";
import { Bus, AlertCircle } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ZONE_COLORS = {
  Library:   "#3b82f6",
  Sports:    "#10b981",
  Hostel:    "#f59e0b",
  FoodCourt: "#ef4444",
  Academic:  "#06b6d4",
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-foreground">{d.zone}</p>
      <div className="mt-1 space-y-0.5">
        <p className="text-xs text-muted-foreground">
          Utilisation: <span className="font-semibold text-foreground">{d.utilization?.toFixed(3)}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Delay: <span className="font-semibold text-foreground">{d.delay} min</span>
        </p>
        <p className="text-[10px] text-muted-foreground/60">{d.time_slot}</p>
      </div>
    </div>
  );
};

export default function TransportScatter({ data }) {
  if (!data) return null;

  const byZone = {};
  (data.scatter || []).forEach((pt) => {
    if (!byZone[pt.zone]) byZone[pt.zone] = [];
    byZone[pt.zone].push(pt);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/10 p-2">
                <Bus className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <CardTitle>Transport Analytics</CardTitle>
                <CardDescription className="mt-1">Bus utilisation vs delay scatter across zones</CardDescription>
              </div>
            </div>
            {data.overcrowded_pct > 5 && (
              <Badge variant="warning" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {data.overcrowded_pct}% overcrowded
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Avg Util:
              <span className="font-semibold text-foreground">{data.avg_utilization?.toFixed(3)}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Avg Delay:
              <span className="font-semibold text-foreground">{data.avg_delay_min?.toFixed(1)} min</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Max Delay:
              <span className="font-semibold text-foreground">{data.max_delay_min} min</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" />
              <XAxis
                dataKey="utilization"
                name="Utilisation"
                type="number"
                tick={{ fontSize: 10, fill: "#52525b" }}
                axisLine={{ stroke: "#1e1e23" }}
                tickLine={false}
                label={{
                  value: "Utilisation",
                  position: "insideBottom",
                  offset: -10,
                  style: { fontSize: 11, fill: "#71717a", fontWeight: 600 },
                }}
              />
              <YAxis
                dataKey="delay"
                name="Delay (min)"
                tick={{ fontSize: 10, fill: "#52525b" }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Delay (min)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fontSize: 11, fill: "#71717a", fontWeight: 600 },
                }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: 8 }} />
              {Object.entries(byZone).map(([zone, points]) => (
                <Scatter
                  key={zone}
                  name={zone}
                  data={points}
                  fill={ZONE_COLORS[zone] || "#888"}
                  opacity={0.7}
                  r={4}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
