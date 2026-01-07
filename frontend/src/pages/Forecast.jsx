import PageWrapper from "../components/PageWrapper";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import { runForecast } from "../services/api";

export default function ForecastPage() {
  const [input, setInput] = useState("10,12,15,14,18");
  const [steps, setSteps] = useState(8);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setError(null);
    const numbers = input.split(",").map(n => Number(n.trim()));
    if (!numbers.length || numbers.some(isNaN)) {
      setError("Enter valid numeric values");
      return;
    }

    setLoading(true);
    try {
      const res = await runForecast({ values: numbers, steps });
      setForecast({ past: numbers, preds: res.data.forecast });
    } catch {
      setError("Forecast failed");
    } finally {
      setLoading(false);
    }
  };

  const getTrendStrength = () => {
    if (!forecast) return "";
    const delta = forecast.preds.at(-1) - forecast.past[0];
    if (delta > 0.5) return "🚀 Strong Upward Trend";
    if (delta > 0.1) return "📈 Moderate Growth";
    if (delta > -0.1) return "➖ Mostly Flat";
    return "📉 Downward Trend";
  };

  const getRange = () => {
    if (!forecast) return null;
    const base = forecast.preds.at(-1);
    return { low: base * 0.9, high: base * 1.1 };
  };

  const chartData = () => ({
    labels: [
      ...forecast.past.map((_, i) => `T-${forecast.past.length - i}`),
      ...forecast.preds.map((_, i) => `F+${i + 1}`),
    ],
    datasets: [
      {
        label: "Historical",
        data: forecast.past,
        borderColor: "#94a3b8",
        tension: 0.3,
      },
      {
        label: "Forecast",
        data: [...Array(forecast.past.length).fill(null), ...forecast.preds],
        borderColor: "#22d3ee",
        borderDash: [6, 4],
        tension: 0.3,
      },
    ],
  });

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-8 pt-24 pb-20">

        <motion.h1 className="text-3xl font-bold mb-3">
          Forecast
        </motion.h1>

        <p className="text-sm text-white/70 mb-10 max-w-2xl">
          Forecast shows the most likely future path assuming current trends continue.
          For uncertainty-aware planning, use Simulation.
        </p>

        {/* INPUT BAR */}
        <div className="flex gap-4 mb-10">
          <input
            className="flex-1 rounded-xl bg-white/10 backdrop-blur px-5 py-3 text-white border border-white/20"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            onClick={handleRun}
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-7 py-3 text-black font-semibold"
          >
            {loading ? "Running..." : "Run Forecast"}
          </button>
        </div>

        {error && <div className="text-red-400 mb-6">{error}</div>}

        {forecast && (
          <div className="grid lg:grid-cols-3 gap-8">

            {/* CHART */}
            <div className="lg:col-span-2 rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-6">
              <Line data={chartData()} />
            </div>

            {/* INSIGHTS PANEL */}
            <div className="space-y-6">

              {/* TREND */}
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5">
                <p className="text-sm text-cyan-200 mb-1">Trend Strength</p>
                <h3 className="text-lg font-semibold text-cyan-100">
                  {getTrendStrength()}
                </h3>
              </div>

              {/* RANGE */}
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                <p className="text-sm text-emerald-200 mb-1">Expected Range</p>
                <p className="text-sm text-white">
                  ₹{getRange().low.toFixed(2)} – ₹{getRange().high.toFixed(2)}
                </p>
              </div>

              {/* ACTION */}
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                <h4 className="font-semibold mb-2">What you can do next</h4>
                <ul className="text-sm text-white/70 space-y-1 list-disc ml-4">
                  <li>This assumes stable behavior</li>
                  <li>Early shocks can change outcomes</li>
                  <li>Use Simulation for risk analysis</li>
                  <li>Use Optimize for concrete actions</li>
                </ul>
              </div>

            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
