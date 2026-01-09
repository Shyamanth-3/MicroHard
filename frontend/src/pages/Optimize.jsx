import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import { useState } from "react";
import { optimize, savePortfolio } from "../services/api";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// 🎨 Dynamic color generator (scales to 36+ assets)
const generateColors = (n) =>
  Array.from({ length: n }, (_, i) =>
    `hsl(${(i * 360) / n}, 70%, 55%)`
  );

export default function Optimize() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState("balanced");

  const stored = JSON.parse(localStorage.getItem("portfolio_data"));

  const handleOptimize = async () => {
    if (!stored || !stored.assets || !stored.returns) {
      return alert("Please upload portfolio data first.");
    }

    try {
      setLoading(true);

      const res = await optimize({
        assets: stored.assets,
        returns: stored.returns,
        goal,
      });

      if (!res?.data?.weights) {
        throw new Error("Invalid optimizer response");
      }

      setResult(res.data.weights);

      await savePortfolio({
        name: "Optimized Portfolio",
        assets: stored.assets,
        returns: stored.returns,
      });
    } catch (err) {
      console.error("❌ Optimization error:", err);
      alert("Optimization failed — check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Prepare pie chart data (exclude zero weights visually)
  const pieData =
    result &&
    stored.assets
      .map((asset, i) => ({
        label: asset,
        value: result[i],
      }))
      .filter((x) => x.value > 0.0001);

  const colors = pieData ? generateColors(pieData.length) : [];

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-8 pt-24 pb-20">

        <motion.h1 className="text-3xl font-bold mb-10">
          Portfolio Optimization
        </motion.h1>

        <div className="grid lg:grid-cols-2 gap-10">

          {/* LEFT — CONTROLS */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
            <h3 className="text-lg font-semibold mb-4">
              Optimization Goal
            </h3>

            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full mb-6 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
            >
              <option value="balanced">Balanced Growth</option>
              <option value="growth">Maximize Growth</option>
              <option value="stable">Increase Stability</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOptimize}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-3 text-black font-semibold"
            >
              {loading ? "Optimizing..." : "Run Optimization"}
            </motion.button>
          </div>

          {/* RIGHT — RESULTS */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
            <h3 className="text-lg font-semibold mb-6">
              Optimized Allocation
            </h3>

            {!result && (
              <p className="text-white/60">
                Run optimization to see recommendations.
              </p>
            )}

            {result && (
              <>
                {/* PIE CHART */}
                {pieData.length > 0 ? (
                  <div className="h-56 mb-6">
                    <Pie
                      data={{
                        labels: pieData.map((x) => x.label),
                        datasets: [
                          {
                            data: pieData.map((x) =>
                              Number((x.value * 100).toFixed(2))
                            ),
                            backgroundColor: colors,
                            borderWidth: 1,
                          },
                        ],
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-white/60 mb-6">
                    Optimizer concentrated allocation into a single asset.
                  </p>
                )}

                {/* WEIGHTS LIST (show all assets) */}
                <ul className="space-y-2 text-sm text-white/80 mb-6">
                  {stored.assets.map((a, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{a}</span>
                      <span>{(result[i] * 100).toFixed(2)}%</span>
                    </li>
                  ))}
                </ul>

                {/* EXPLANATION */}
                <div className="rounded-xl bg-black/20 p-4 text-sm text-white/70 mb-4">
                  <p className="mb-1 font-semibold text-white">
                    Why this helps you
                  </p>
                  <p>
                    The optimizer redistributed your assets to best match your
                    selected goal on the efficient frontier — balancing return
                    and risk mathematically.
                  </p>
                </div>

                {/* NEXT STEPS */}
                <div className="rounded-xl bg-black/20 p-4 text-sm text-white/70">
                  <p className="mb-1 font-semibold text-white">
                    Suggested next steps
                  </p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Rebalance quarterly</li>
                    <li>Avoid single-asset overexposure</li>
                    <li>Stress-test via Simulation</li>
                  </ul>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
