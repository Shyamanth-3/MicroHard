import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import { useState } from "react";
import { optimize, savePortfolio } from "../services/api";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Optimize() {

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    const stored = JSON.parse(localStorage.getItem("portfolio_data"));

    if (!stored || !Array.isArray(stored.assets) || !Array.isArray(stored.returns)) {
      return alert("No valid portfolio data found. Please upload a CSV with `asset` and `return` columns first.");
    }

    if (stored.assets.length === 0 || stored.returns.length === 0 || stored.assets.length !== stored.returns.length) {
      return alert("Portfolio data invalid: assets and returns must be non-empty arrays of the same length.");
    }

    try {
      setLoading(true);

      // get optimized weights
      const res = await optimize({
        assets: stored.assets,
        returns: stored.returns
      });

      setResult(res.data.weights);

      // save to DB
      await savePortfolio({
        name: "Demo Portfolio",
        assets: stored.assets,
        returns: stored.returns
      });

    } catch (err) {
      console.error(err);
      alert("Optimization failed — check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="relative z-10 mx-auto max-w-7xl px-8 pt-24 pb-20">

        <motion.h1 className="text-3xl font-bold tracking-tight mb-12">
          Portfolio Optimization
        </motion.h1>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

          {/* LEFT */}
          <motion.div className="rounded-3xl bg-white/5 border border-white/10 p-8">
            <h3 className="text-lg font-semibold mb-6">Optimization Inputs</h3>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOptimize}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-3 text-sm font-semibold text-black"
            >
              {loading ? "Running..." : "Run Optimization"}
            </motion.button>
          </motion.div>

          {/* RIGHT */}
          <motion.div className="rounded-3xl bg-white/5 border border-white/10 p-8">
            <h3 className="text-lg font-semibold mb-6">Optimized Portfolio</h3>

            {!result && <p className="text-white/60">Run optimization to see results.</p>}

            {result && (
              <>
                <div className="h-64 mb-6">
                  <Pie
                    data={{
                      labels: JSON.parse(localStorage.getItem("portfolio_data")).assets,
                      datasets: [
                        {
                          data: result.map(w => (w * 100).toFixed(2)),
                          backgroundColor: ["#22d3ee", "#34d399", "#facc15", "#fb7185"]
                        }
                      ]
                    }}
                  />
                </div>

                <ul className="space-y-3 text-sm text-white/80">
                  {JSON.parse(localStorage.getItem("portfolio_data")).assets.map((a, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{a}</span>
                      <span>{(result[i] * 100).toFixed(2)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </motion.div>

        </div>
      </div>
    </PageWrapper>
  );
}
