import { motion } from "framer-motion";
import { Pie, Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Home() {
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const stagger = {
    visible: {
      transition: { staggerChildren: 0.15 },
    },
  };

  // --- SAMPLE DATA (later we’ll connect to backend) ---
  const spendingData = {
    labels: ["Food", "Rent", "Shopping", "Travel", "Investments"],
    datasets: [
      {
        data: [18, 40, 12, 10, 20],
        backgroundColor: [
          "#22d3ee",
          "#34d399",
          "#facc15",
          "#fb7185",
          "#a78bfa"
        ]
      }
    ]
  };

  const networthData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Net Worth (₹)",
        data: [120000, 130000, 140000, 150000, 162000, 175000],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,.2)",
        tension: 0.35,
        fill: true
      }
    ]
  };

  return (
    <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-14 px-8 pt-20 md:grid-cols-2 md:pt-28">
      
      {/* LEFT */}
      <motion.div
        className="flex flex-col justify-center"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={fadeUp}
          className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl"
        >
          All your financial data,
          <span className="block bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            understood beautifully.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-base leading-relaxed text-white/70"
        >
          FinSight aggregates your finances, runs simulations, forecasts outcomes,
          and answers questions using AI — all in one elegant dashboard.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex gap-6">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-7 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-400/20"
          >
            Get Started
          </motion.button>
        </motion.div>
      </motion.div>

      {/* RIGHT — DASHBOARD PREVIEW */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-black/40"
      >
        <p className="mb-4 text-sm text-white/60">Live dashboard preview</p>

        {/* Charts grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Spending Pie */}
          <div className="h-52 rounded-xl bg-black/20 p-3">
            <Pie data={spendingData} />
          </div>

          {/* Net Worth Line */}
          <div className="h-52 rounded-xl bg-black/20 p-3">
            <Line data={networthData} />
          </div>

        </div>
      </motion.div>
    </main>
  );
}
