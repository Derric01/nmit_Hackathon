import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  Cpu,
  Database,
  Layers,
} from "lucide-react";

/* ── Rotating words for the headline ────────────── */
const WORDS = ["optimise", "predict", "analyse", "transform"];
const WORD_INTERVAL = 2400;

/* ── Decorative SVG grid (inspired by reference) ── */
function GridDecoration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute top-0 left-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Diagonal accent lines */}
      <svg className="absolute -top-20 -right-20 w-[600px] h-[600px] opacity-[0.06]" viewBox="0 0 600 600">
        <line x1="0" y1="600" x2="600" y2="0" stroke="white" strokeWidth="0.5" />
        <line x1="100" y1="600" x2="600" y2="100" stroke="white" strokeWidth="0.5" />
        <line x1="200" y1="600" x2="600" y2="200" stroke="white" strokeWidth="0.3" />
      </svg>
      <svg className="absolute -bottom-20 -left-20 w-[500px] h-[500px] opacity-[0.05]" viewBox="0 0 500 500">
        <line x1="0" y1="0" x2="500" y2="500" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="100" x2="400" y2="500" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="200" x2="300" y2="500" stroke="white" strokeWidth="0.3" />
      </svg>
      {/* Subtle radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
    </div>
  );
}

/* ── Animated word rotator ─────────────────────── */
function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), WORD_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-block relative h-[1.15em] w-[4.2em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute left-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent"
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── Fade-up animation variant ─────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/* ── Stat pills ────────────────────────────────── */
const STATS = [
  { icon: Database, label: "6,000+ records analysed" },
  { icon: Cpu, label: "ML-powered predictions" },
  { icon: BarChart3, label: "Real-time insights" },
];

/* ══════════════════════════════════════════════════ */
export default function LandingPage({ onEnter }) {
  const handleEnter = useCallback(() => onEnter?.(), [onEnter]);

  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">
      <GridDecoration />

      {/* ── Nav ──────────────────────────── */}
      <header className="relative z-20 w-full bg-transparent">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Layers className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold text-foreground tracking-tight">
              SmartCampus
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-8 text-[13px] text-muted-foreground font-medium">
            <span className="hover:text-foreground transition-colors cursor-default">Features</span>
            <span className="hover:text-foreground transition-colors cursor-default">Analytics</span>
            <span className="hover:text-foreground transition-colors cursor-default">About</span>
          </nav>
          <button
            onClick={handleEnter}
            className="h-9 px-4 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[13px] font-medium text-foreground hover:bg-white/[0.1] transition-all duration-200 cursor-pointer backdrop-blur-sm"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-3xl mx-auto text-center pt-8 sm:pt-16 pb-20">

          {/* Announcement pill */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <button
              onClick={handleEnter}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-[13px] text-zinc-400 font-medium mb-10 hover:bg-white/[0.06] transition-all duration-300 cursor-pointer backdrop-blur-sm group"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-zinc-300">Hackathon Project</span>
              <span className="text-zinc-600 mx-1">·</span>
              Smart Campus Operations
              <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>

          {/* Credibility line */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <p className="text-[13px] text-zinc-500 font-medium tracking-wide mb-7">
              Powered by{" "}
              <span className="text-zinc-300 font-semibold">RandomForest</span>
              {" "}&{" "}
              <span className="text-zinc-300 font-semibold">Gradient Boosting</span>
              {" "}models
            </p>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] font-extrabold text-foreground tracking-[-0.035em] leading-[1.08] mb-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            Campus Intelligence
            <br />
            <span className="text-zinc-400 font-bold">
              To{" "}
            </span>
            <RotatingWord />
            <span className="text-zinc-400 font-bold">
              {" "}operations
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-base sm:text-lg text-zinc-500 max-w-lg mx-auto leading-relaxed mb-10"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            Stop guessing what&apos;s happening and build a
            data-driven strategy for your campus operations.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <button
              onClick={handleEnter}
              className="group relative inline-flex items-center gap-2.5 h-12 px-7 rounded-xl text-[15px] font-semibold text-white cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_0_32px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%)",
              }}
            >
              <span className="relative z-10">Explore Dashboard</span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </motion.div>

          {/* Stat badges row */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4 mt-14"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] text-[12px] text-zinc-500 font-medium"
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2} />
                  {s.label}
                </div>
              );
            })}
          </motion.div>
        </div>
      </main>

      {/* ── Footer ───────────────────────── */}
      <footer className="relative z-10 py-6">
        <p className="text-center text-[11px] text-zinc-600">
          SmartCampus &middot; Decision Intelligence Platform &middot; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
