import { motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-0.5">
        {payload[0]?.payload?.feature}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-muted-foreground">Importance:</span>
        <span className="font-bold text-foreground">{payload[0]?.value}%</span>
      </div>
    </div>
  );
};

export default function SatisfactionImpact({ data }) {
  if (!data) return null;

  const importanceData = data.feature_importance?.map((d) => ({
    feature: d.feature
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    importance: +(d.importance * 100).toFixed(2),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Star className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <CardTitle>Satisfaction Impact Model</CardTitle>
                <CardDescription className="mt-1">RandomForest feature importance driving student satisfaction</CardDescription>
              </div>
            </div>
            <Badge variant="success">R² {data.r2_score}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Metric pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              R² Score:
              <span className="font-semibold text-foreground">{data.r2_score}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              MAE:
              <span className="font-semibold text-foreground">{data.mae}</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Feature Importance (%)
          </p>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={importanceData}
              layout="vertical"
              margin={{ left: 10, right: 20, top: 0, bottom: 0 }}
              barSize={24}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" horizontal={false} />
              <XAxis
                type="number"
                unit="%"
                tick={{ fontSize: 10, fill: "#52525b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="feature"
                type="category"
                width={120}
                tick={{ fontSize: 11, fill: "#a1a1aa", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
              <Bar dataKey="importance" name="Importance" radius={[0, 6, 6, 0]}>
                {importanceData?.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
