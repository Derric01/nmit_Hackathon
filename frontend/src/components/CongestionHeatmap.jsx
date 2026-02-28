import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrafficCone, AlertTriangle, MapPin, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ZONES = ["Library", "Sports", "Hostel", "FoodCourt", "Academic"];
const SLOTS = ["Morning", "Afternoon", "Evening", "Night"];

function getCellColor(value) {
  const t = Math.min(value / 1.15, 1);
  if (t < 0.35) return "bg-emerald-500/20 text-emerald-400";
  if (t < 0.55) return "bg-amber-500/20 text-amber-400";
  if (t < 0.75) return "bg-orange-500/20 text-orange-400";
  return "bg-red-500/20 text-red-300";
}

function getCellBorder(value) {
  const t = Math.min(value / 1.15, 1);
  if (t < 0.35) return "border-emerald-500/10";
  if (t < 0.55) return "border-amber-500/10";
  if (t < 0.75) return "border-orange-500/10";
  return "border-red-500/20";
}

export default function CongestionHeatmap({ data }) {
  const matrix = useMemo(() => {
    if (!data?.heatmap) return {};
    const m = {};
    data.heatmap.forEach((d) => {
      m[`${d.zone}_${d.time_slot}`] = d.congestion_index;
    });
    return m;
  }, [data]);

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2">
                <TrafficCone className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <CardTitle>Congestion Heatmap</CardTitle>
                <CardDescription className="mt-1">Zone × Time Slot congestion intensity</CardDescription>
              </div>
            </div>
            {data.bottleneck_count > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {data.bottleneck_count} bottleneck{data.bottleneck_count > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Metric pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{data.overall_avg_congestion}</span>
              avg index
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="font-medium text-foreground">{data.most_congested_zone}</span>
              peak zone
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="font-medium text-foreground">{data.most_congested_time_slot}</span>
              peak slot
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "4px" }}>
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2 w-28">
                    Zone
                  </th>
                  {SLOTS.map((s) => (
                    <th key={s} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-2">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z, zi) => (
                  <motion.tr
                    key={z}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + zi * 0.05 }}
                  >
                    <td className="text-[13px] font-semibold text-foreground px-2 py-2">
                      {z}
                    </td>
                    {SLOTS.map((s) => {
                      const val = matrix[`${z}_${s}`];
                      return (
                        <td key={s} className="text-center p-1">
                          <div
                            className={`rounded-lg py-3 px-2 text-[13px] font-bold border transition-all duration-200 hover:scale-[1.03] cursor-default ${
                              val != null
                                ? `${getCellColor(val)} ${getCellBorder(val)}`
                                : "bg-muted text-muted-foreground border-transparent"
                            }`}
                            title={`${z} · ${s}: ${val?.toFixed(3) ?? "N/A"}`}
                          >
                            {val != null ? val.toFixed(3) : "—"}
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-[10px] text-muted-foreground">Low</span>
            <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
