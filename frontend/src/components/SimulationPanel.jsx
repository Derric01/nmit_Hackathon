import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Play, Loader2, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { runSimulation } from "../services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function SimulationPanel() {
  const [congestion, setCongestion] = useState(0);
  const [delay, setDelay] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const handleSimulate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runSimulation({
        congestionReduction: congestion,
        delayReduction: delay,
      });
      setResult(res);
      setHasRun(true);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  }, [congestion, delay]);

  const ImpactIcon = result?.improvement_pct > 0 ? TrendingUp : result?.improvement_pct < 0 ? TrendingDown : Minus;
  const impactColor = result?.improvement_pct > 0
    ? "text-emerald-400"
    : result?.improvement_pct < 0
    ? "text-red-400"
    : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-card via-card to-blue-500/[0.03] border-blue-500/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <FlaskConical className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <CardTitle>What-If Simulation</CardTitle>
              <CardDescription className="mt-1">
                Project satisfaction changes under hypothetical operational improvements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  Congestion Reduction
                </label>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {congestion}%
                </span>
              </div>
              <Slider
                value={[congestion]}
                onValueChange={(v) => setCongestion(v[0])}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/50">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  Delay Reduction
                </label>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {delay}%
                </span>
              </div>
              <Slider
                value={[delay]}
                onValueChange={(v) => setDelay(v[0])}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/50">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>

          <Button onClick={handleSimulate} disabled={loading} size="default">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running simulation…
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Simulation
              </>
            )}
          </Button>

          {/* Results */}
          <AnimatePresence>
            {hasRun && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border bg-muted/40"
              >
                {/* Baseline */}
                <div className="flex-1 min-w-[120px] text-center p-3 rounded-lg bg-background/60">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Baseline
                  </p>
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {result.baseline_satisfaction}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Current avg</p>
                </div>

                <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 hidden sm:block" />

                {/* Projected */}
                <div className="flex-1 min-w-[120px] text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Projected
                  </p>
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {result.projected_satisfaction}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">After improvement</p>
                </div>

                {/* Impact */}
                <div className="flex-1 min-w-[120px] text-center p-3 rounded-lg bg-background/60">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Impact
                  </p>
                  <div className={`flex items-center justify-center gap-1 ${impactColor}`}>
                    <ImpactIcon className="w-4 h-4" />
                    <span className="text-2xl font-bold tracking-tight">
                      {result.improvement_pct > 0 ? "+" : ""}{result.improvement_pct}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Projected change</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
