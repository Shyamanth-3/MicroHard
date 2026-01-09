import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Navbar from "./components/navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Simulation from "./pages/Simulation";
import Optimize from "./pages/Optimize";
import AskAI from "./pages/AskAI";
import ForecastPage from "./pages/Forecast";
import SignIn from "./pages/SignIn";

function AnimatedRoutes() {
  const location = useLocation();

  const RequireAuth = ({ children }) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return <SignIn />;
    }
    return children;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
        <Route path="/simulation" element={<RequireAuth><Simulation /></RequireAuth>} />
        <Route path="/optimize" element={<RequireAuth><Optimize /></RequireAuth>} />
        <Route path="/forecast" element={<RequireAuth><ForecastPage /></RequireAuth>} />
        <Route path="/ask-ai" element={<RequireAuth><AskAI /></RequireAuth>} />
        {/* Fallback for undefined routes */}
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* GLOBAL BACKGROUND – ONLY HERE */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2b0f4e] via-[#08192b] to-[#0a2b2b] text-white">

        {/* soft glow */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-600/30 blur-[160px]" />
          <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/25 blur-[160px]" />
          <div className="absolute bottom-[-200px] left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[160px]" />
        </div>

        <Navbar />

        {/* PAGE CONTENT */}
        <main className="relative z-10">
          <AnimatedRoutes />
        </main>

      </div>
    </BrowserRouter>
  );
}
