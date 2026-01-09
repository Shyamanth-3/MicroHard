import PageWrapper from "../components/PageWrapper";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import { getAnalyticsCategories, getAnalyticsCashflow, getScore, getAnalyticsNetworth } from "../services/api";
import { AIService } from "../services/aiService";

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
  const [categories, setCategories] = useState([]);
  const [cashflow, setCashflow] = useState([]);
  const [score, setScore] = useState(null);
  const [networth, setNetworth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [categoriesRes, cashflowRes, scoreRes, networthRes] = await Promise.all([
          getAnalyticsCategories(),
          getAnalyticsCashflow(),
          getScore(),
          getAnalyticsNetworth(100000)
        ]);
        
        const categoriesData = categoriesRes.data || [];
        const cashflowData = cashflowRes.data || [];
        const scoreData = scoreRes.data || {};
        const networthData = networthRes.data || null;
        
        // Ensure arrays
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setCashflow(Array.isArray(cashflowData) ? cashflowData : []);
        setScore(scoreData);
        setNetworth(networthData);
        
        // Generate AI summary
        setAiLoading(true);
        const summary = await AIService.summarizeDashboard({
          categories: Array.isArray(categoriesData) ? categoriesData : [],
          cashflow: Array.isArray(cashflowData) ? cashflowData : [],
          score: scoreData
        });
        
        if (summary.success) {
          setAiSummary(summary.analysis);
        }
        setAiLoading(false);
      } catch (err) {
        setError("Failed to load dashboard");
        console.error(err);
        setAiLoading(false);
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

  if (error) {
    return (
      <PageWrapper>
        <div className="pt-40 text-center text-red-400">
          {error}
        </div>
      </PageWrapper>
    );
  }

  // Prepare chart data from backend response
  const categoryLabels = categories.map(c => c.category || 'Unknown');
  const categoryTotals = categories.map(c => Math.abs(c.total || 0));
  
  const cashflowMonths = cashflow.map(c => c.month || '');
  const incomeData = cashflow.map(c => c.income || 0);
  const expenseData = cashflow.map(c => Math.abs(c.expenses || 0));

  const networthMonths = networth?.months || [];
  const networthSeries = networth?.net_worth || [];
  const portfolioSeries = networth?.portfolio_value || [];
  const savingsSeries = networth?.net_savings || [];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">

          {/* CONFIDENCE SCORE */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/60">Confidence Score</p>
            <h3 className="text-2xl font-bold text-emerald-400">
              {score?.score || 0}/100
            </h3>
            <p className="text-xs text-white/50 mt-1">
              {score?.explanation || ''}
            </p>
          </div>

          {/* TOTAL INCOME */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/60">Total Income</p>
            <h3 className="text-xl font-bold text-emerald-300">
              ₹ {incomeData.reduce((a, b) => a + b, 0).toLocaleString()}
            </h3>
          </div>

          {/* TOTAL EXPENSES */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/60">Total Expenses</p>
            <h3 className="text-xl font-semibold text-red-300">
              ₹ {expenseData.reduce((a, b) => a + b, 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* NET WORTH OVER TIME */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <h4 className="text-sm font-semibold mb-4">
              Net Worth Over Time
            </h4>
            {networthMonths.length > 0 ? (
              <Line
                data={{
                  labels: networthMonths,
                  datasets: [
                    {
                      label: "Net Worth",
                      data: networthSeries,
                      borderColor: "#06b6d4",
                      backgroundColor: "rgba(6,182,212,0.15)",
                      tension: 0.3,
                    },
                    {
                      label: "Portfolio",
                      data: portfolioSeries,
                      borderColor: "#22c55e",
                      backgroundColor: "rgba(34,197,94,0.1)",
                      borderDash: [6,4],
                      tension: 0.3,
                    },
                    {
                      label: "Cumulative Savings",
                      data: savingsSeries,
                      borderColor: "#f59e0b",
                      backgroundColor: "rgba(245,158,11,0.1)",
                      borderDash: [3,3],
                      tension: 0.3,
                    }
                  ],
                }}
              />
            ) : (
              <p className="text-white/50 text-sm">Net worth data will appear after uploading a portfolio returns CSV and some transactions.</p>
            )}
          </div>

          {/* CASHFLOW TREND */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <h4 className="text-sm font-semibold mb-4">
              Income vs Expenses Over Time
            </h4>
            {cashflowMonths.length > 0 ? (
              <Line
                data={{
                  labels: cashflowMonths,
                  datasets: [
                    {
                      label: "Income",
                      data: incomeData,
                      borderColor: "#22c55e",
                      backgroundColor: "rgba(34,197,94,0.15)",
                      tension: 0.3,
                    },
                    {
                      label: "Expenses",
                      data: expenseData,
                      borderColor: "#ef4444",
                      backgroundColor: "rgba(239,68,68,0.15)",
                      tension: 0.3,
                    },
                  ],
                }}
              />
            ) : (
              <p className="text-white/50 text-sm">No cashflow data available</p>
            )}
          </div>

          {/* SPENDING BY CATEGORY PIE */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <h4 className="text-sm font-semibold mb-2">
              Spending by Category
            </h4>
            <div className="h-56 flex items-center justify-center">
              {categoryLabels.length > 0 ? (
                <Pie
                  data={{
                    labels: categoryLabels,
                    datasets: [
                      {
                        data: categoryTotals,
                        backgroundColor: ["#22c55e", "#0ea5e9", "#a855f7", "#f59e0b", "#ef4444"],
                      },
                    ],
                  }}
                />
              ) : (
                <p className="text-white/50 text-sm">No category data available</p>
              )}
            </div>
          </div>
        </div>

        {/* AI SUMMARY */}
        {aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 rounded-3xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-400/30 p-8"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">🤖</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-3 text-white">AI Insights</h3>
                <p className="text-white/80 leading-relaxed text-base">
                  {aiSummary}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {aiLoading && (
          <div className="mt-10 text-center text-white/60 text-sm">
            ✨ Generating AI insights...
          </div>
        )}

        {/* AI INSIGHT */}
        <div className="mt-10 rounded-3xl bg-white/5 border border-white/10 p-6">
          <h4 className="text-sm font-semibold mb-2">
            AI Insight
          </h4>
          <p className="text-sm text-white/70 leading-relaxed">
            {score?.main_risk ? `Main Risk: ${score.main_risk}. ` : ''}
            Your financial confidence is influenced by how stable your spending
            patterns are across months. Improving consistency can significantly
            strengthen long-term planning outcomes.
          </p>
        </div>

      </div>
    </PageWrapper>
  );
}
