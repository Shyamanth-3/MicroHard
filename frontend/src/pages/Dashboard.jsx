import PageWrapper from "../components/PageWrapper";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import { getDashboardSummary } from "../services/api";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getDashboardSummary();
        const payload = res.data || res;
        setData(payload);
        setSelectedMonth(payload.months[payload.months.length - 1]);
      } catch (err) {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <div className="pt-40 text-center text-white/70">
          Analyzing your finances…
        </div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper>
        <div className="pt-40 text-center text-red-400">
          {error || "No data available"}
        </div>
      </PageWrapper>
    );
  }

  const account =
    data.accounts.find((a) => a.id === selectedAccount) || data.accounts[0];

  const monthData = data.monthly_data[selectedMonth];

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-8 pt-24 pb-20">

        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8"
        >
          Dashboard
        </motion.h1>

        {/* KPI STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">

          {/* CONFIDENCE SCORE */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/60">Confidence Score</p>
            <h3 className="text-2xl font-bold text-emerald-400">
              {data.confidence_score}/100
            </h3>
          </div>

          {/* SPENDING STABILITY */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/60">Spending Stability</p>
            <p className="text-sm font-semibold text-white">
              {data.stability}
            </p>
            <p className="mt-1 text-[11px] text-white/50">
              {data.stability_reason}
            </p>
          </div>

          {/* NET WORTH */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/60">Net Worth</p>
            <h3 className="text-xl font-bold text-emerald-300">
              ₹ {account.net_worth.toLocaleString()}
            </h3>

            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="mt-2 w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1 text-xs text-white"
            >
              {data.accounts.map((acc) => (
                <option
                  key={acc.id}
                  value={acc.id}
                  className="bg-[#0b0f1a]"
                >
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* MONTHLY EXPENSE */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/60">Monthly Expenses</p>
            <h3 className="text-xl font-semibold text-red-300">
              ₹ {monthData.expenses.toLocaleString()}
            </h3>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-2 w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1 text-xs text-white"
            >
              {data.months.map((m) => (
                <option key={m} value={m} className="bg-[#0b0f1a]">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* NET WORTH TREND */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <h4 className="text-sm font-semibold mb-4">
              Net Worth Trend
            </h4>
            <Line
              data={{
                labels: ["Year 1", "Year 2", "Year 3", "Year 4"],
                datasets: [
                  {
                    label: "Net Worth",
                    data: [5, 6.2, 7.8, 9.4],
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34,197,94,0.15)",
                  },
                ],
              }}
            />
          </div>

          {/* SMALLER PIE */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <h4 className="text-sm font-semibold mb-2">
              Asset Allocation
            </h4>
            <div className="h-56 flex items-center justify-center">
              <Pie
                data={{
                  labels: ["Savings", "Investments", "Cash"],
                  datasets: [
                    {
                      data: [30, 55, 15],
                      backgroundColor: ["#22c55e", "#0ea5e9", "#a855f7"],
                    },
                  ],
                }}
              />
            </div>
          </div>
        </div>

        {/* AI INSIGHT */}
        <div className="mt-10 rounded-3xl bg-white/5 border border-white/10 p-6">
          <h4 className="text-sm font-semibold mb-2">
            AI Insight
          </h4>
          <p className="text-sm text-white/70 leading-relaxed">
            Your financial confidence is influenced by how stable your spending
            patterns are across months. Improving consistency can significantly
            strengthen long-term planning outcomes.
          </p>
        </div>

      </div>
    </PageWrapper>
  );
}
