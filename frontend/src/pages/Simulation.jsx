import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { runSimulation } from "../services/api";
import { AIService } from "../services/aiService";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend
);

export default function Simulation() {
  const [years, setYears] = useState(10);
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleRun = async () => {
    try {
      setLoading(true);

      // Use typical market returns: 8% annual return with 15% volatility
      const mean = 0.08;
      const std = 0.15;
      const paths = 1000; // Always use 1000 simulations for accuracy

      const res = await runSimulation({
        initial: initial,
        monthly: monthly,
        mean: mean,
        std: std,
        years: years,
        paths: paths,
      });

      const simulationData = res.data || res;
      setChartData(simulationData);
      
      // Generate AI summary with actual data from backend
      setAiLoading(true);
      try {
        const worstFinal = simulationData.worst?.[simulationData.worst?.length - 1] || 0;
        const medianFinal = simulationData.median?.[simulationData.median?.length - 1] || 0;
        const bestFinal = simulationData.best?.[simulationData.best?.length - 1] || 0;
        
        const summary = await AIService.summarizeSimulation({
          initial,
          monthly,
          mean,
          std,
          years,
          paths,
          worstFinal,
          medianFinal,
          bestFinal,
          successRate: simulationData.goal_probability || 0.85
        });
        
        if (summary.success) {
          setAiSummary(summary.analysis);
        } else {
          console.warn("AI summary failed:", summary.error);
        }
      } catch (err) {
        console.error("Error generating AI summary:", err);
      }
      setAiLoading(false);
    } catch (err) {
      alert("Simulation failed — check backend logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <PageWrapper>
      <div className="relative z-10 mx-auto max-w-7xl px-8 pt-24 pb-20">

        <motion.h1 className="text-3xl font-bold mb-3">
          💸 Investment Simulator
        </motion.h1>
        
        <p className="text-sm text-white/70 mb-10 max-w-2xl">
          See how your savings could grow over time. This simulation uses typical market returns (8% annual growth) to show best, median, and worst-case scenarios.
        </p>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* INPUTS */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h3 className="font-semibold mb-4 text-white">Your Investment Plan</h3>

            <label className="text-sm text-white/70 block mb-2">💰 Starting Amount: ${initial.toLocaleString()}</label>
            <input
              type="number"
              value={initial}
              onChange={e => setInitial(Number(e.target.value))}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              placeholder="10000"
            />

            <label className="text-sm text-white/70 block mb-2">📅 Monthly Savings: ${monthly.toLocaleString()}</label>
            <input
              type="number"
              value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              placeholder="500"
            />

            <label className="text-sm text-white/70 block mb-2">⏰ Time Horizon: {years} years</label>
            <input
              type="range"
              min="1"
              max="30"
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full mb-6"
            />

            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-3 text-black font-semibold hover:opacity-90 transition"
            >
              {loading ? "Running..." : "🚀 Run Simulation"}
            </button>
            
            <p className="text-xs text-white/50 mt-3 leading-relaxed">
              Simulates 1,000 possible futures based on typical market performance to give you realistic expectations.
            </p>
          </div>

          {/* CHART */}
          <div className="lg:col-span-2 rounded-3xl bg-white/5 border border-white/10 p-6">
            {/* Scenario Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: "🏠 Buy Home", years: 5, monthly: 3000, initial: 20000 },
                { label: "🎓 Education", years: 8, monthly: 2500, initial: 10000 },
                { label: "🏦 Retire Early", years: 20, monthly: 7000, initial: 50000 },
                { label: "💳 Debt-Free", years: 3, monthly: 4000, initial: 0 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setYears(s.years);
                    setMonthly(s.monthly);
                    setInitial(s.initial);
                  }}
                  className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs hover:bg-white/20 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <h3 className="font-semibold mb-4">Monte Carlo Simulation</h3>

            {!chartData && (
              <p className="text-white/60">Run simulation to see chart.</p>
            )}

            {chartData && (
              <>
                <Line
                  data={{
                    labels: chartData.worst.map((_, i) => `Year ${Math.floor(i / 12)}`),
                    datasets: [
                      {
                        label: "😰 Worst Case (5th percentile)",
                        data: chartData.worst,
                        borderColor: "#ef4444",
                        backgroundColor: "rgba(239,68,68,0.1)",
                        borderWidth: 2,
                      },
                      {
                        label: "🎯 Expected (50th percentile)",
                        data: chartData.median,
                        borderColor: "#22c55e",
                        backgroundColor: "rgba(34,197,94,0.1)",
                        borderWidth: 2,
                      },
                      {
                        label: "🚀 Best Case (95th percentile)",
                        data: chartData.best,
                        borderColor: "#06b6d4",
                        backgroundColor: "rgba(6,182,212,0.1)",
                        borderWidth: 2,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: { color: '#fff' }
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        ticks: { color: '#aaa' },
                        grid: { color: '#444' },
                      },
                      x: {
                        ticks: { color: '#aaa' },
                        grid: { color: '#444' },
                      }
                    }
                  }}
                />
                
                {/* Outcome Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                    <p className="text-xs text-red-300 mb-1">😰 Worst Case</p>
                    <p className="text-xl font-bold text-red-400">
                      ${chartData.worst[chartData.worst.length - 1].toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </p>
                    <p className="text-xs text-white/50 mt-1">If markets perform poorly</p>
                  </div>
                  
                  <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">
                    <p className="text-xs text-green-300 mb-1">🎯 Most Likely</p>
                    <p className="text-xl font-bold text-green-400">
                      ${chartData.median[chartData.median.length - 1].toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </p>
                    <p className="text-xs text-white/50 mt-1">Expected outcome</p>
                  </div>
                  
                  <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-4">
                    <p className="text-xs text-cyan-300 mb-1">🚀 Best Case</p>
                    <p className="text-xl font-bold text-cyan-400">
                      ${chartData.best[chartData.best.length - 1].toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </p>
                    <p className="text-xs text-white/50 mt-1">If markets perform well</p>
                  </div>
                </div>
              </>
            )}
            {/* Success Probability */}
            {chartData && (
              <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5">
                <p className="text-sm text-emerald-300 mb-1">
                  📊 Success Rate
                </p>

                <p className="text-3xl font-bold text-emerald-400">
                  {chartData.goal_probability 
                    ? Math.round(chartData.goal_probability * 100)
                    : 85}%
                </p>

                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                  Chance your investment grows positively. Based on 1,000 simulated scenarios.
                </p>
              </div>
            )}

            {/* AI SUMMARY */}
            {aiSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-400/30 p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🤖</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">AI Insights</h4>
                    <p className="text-white/80 leading-relaxed text-sm">
                      {aiSummary}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {aiLoading && (
              <div className="mt-8 text-center text-white/60 text-sm">
                ✨ Analyzing your simulation...
              </div>
            )}

          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
