import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("portfolio_data"));
    setPortfolio(stored);
  }, []);

  const totalReturn = portfolio
    ? portfolio.returns.reduce((a, b) => a + b, 0) * 100
    : 0;

  return (
    <PageWrapper>
      <div className="relative z-10 mx-auto max-w-7xl px-8 pt-24 pb-20">

        {/* PAGE TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold tracking-tight mb-10"
        >
          Dashboard
        </motion.h1>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Assets Tracked", value: portfolio ? portfolio.assets.length : "-" },
            { label: "Expected Return", value: portfolio ? `${totalReturn.toFixed(2)}%` : "-" },
            { label: "Optimization Ready", value: portfolio ? "Yes" : "Upload Data" },
            { label: "Risk Score", value: "Moderate" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
            >
              <p className="text-sm text-white/60">{item.label}</p>
              <h3 className="mt-2 text-2xl font-semibold">
                {item.value}
              </h3>
            </motion.div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* SPENDING / ALLOCATION */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
          >
            <h4 className="text-lg font-semibold mb-4">
              Portfolio Allocation
            </h4>

            {!portfolio && (
              <div className="h-64 flex items-center justify-center text-white/60">
                Upload data to see allocation.
              </div>
            )}

            {portfolio && (
              <Pie
                data={{
                  labels: portfolio.assets,
                  datasets: [
                    {
                      data: portfolio.returns,
                      backgroundColor: [
                        "#22c55e",
                        "#0ea5e9",
                        "#a855f7",
                        "#facc15",
                        "#f43f5e"
                      ]
                    }
                  ]
                }}
              />
            )}
          </motion.div>

          {/* NET WORTH */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
          >
            <h4 className="text-lg font-semibold mb-4">
              Net Worth Growth (Mock)
            </h4>

            <Line
              data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                datasets: [
                  {
                    label: "Net Worth",
                    data: [2, 2.6, 3.0, 3.7, 4.4],
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34,197,94,0.2)"
                  }
                ]
              }}
            />
          </motion.div>

        </div>

        {/* LOWER GRID */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* TRANSACTIONS */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
          >
            <h4 className="text-lg font-semibold mb-4">
              Recent Transactions (Mock)
            </h4>

            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex justify-between">
                <span>Amazon</span>
                <span>- ₹2,400</span>
              </li>
              <li className="flex justify-between">
                <span>Rent</span>
                <span>- ₹15,000</span>
              </li>
              <li className="flex justify-between">
                <span>Salary</span>
                <span className="text-emerald-300">+ ₹50,000</span>
              </li>
            </ul>
          </motion.div>

          {/* AI INSIGHTS */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
          >
            <h4 className="text-lg font-semibold mb-4">
              AI Insights
            </h4>

            <p className="text-white/70 text-sm leading-relaxed">
              Your investments are currently tilted toward higher-return assets.
              Rebalancing once a quarter may improve stability while maintaining performance.
            </p>
          </motion.div>

        </div>

      </div>
    </PageWrapper>
  );
}
