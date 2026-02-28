import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";

function App() {
  const [view, setView] = useState("landing");

  return (
    <TooltipProvider>
      {view === "landing" ? (
        <LandingPage onEnter={() => setView("dashboard")} />
      ) : (
        <Dashboard onBack={() => setView("landing")} />
      )}
    </TooltipProvider>
  );
}

export default App;
