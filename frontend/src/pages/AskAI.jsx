import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";

export default function AskAI() {
  return (
    <PageWrapper>
      <div className="relative z-10 mx-auto max-w-4xl px-8 pt-24 pb-24">

        {/* PAGE TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-3xl font-bold tracking-tight"
        >
          Ask FinSight AI
        </motion.h1>

        <p className="mb-10 max-w-2xl text-sm text-white/70">
          Ask questions about your spending, savings, forecasts, or simulations.
          FinSight AI uses your financial data to give personalized insights.
        </p>

        {/* CHAT CONTAINER */}
        <div className="flex h-[520px] flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">

          {/* CHAT MESSAGES */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">

            {/* AI MESSAGE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[80%] rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 p-4 text-sm text-white/90"
            >
              👋 Hi! I’m FinSight AI.  
              Ask me anything about your finances — forecasts, risks, or optimizations.
            </motion.div>

            {/* USER MESSAGE (placeholder) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="ml-auto max-w-[80%] rounded-2xl bg-white/10 p-4 text-sm text-white"
            >
              How can I increase my savings over the next 3 years?
            </motion.div>

            {/* AI RESPONSE (placeholder) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-[80%] rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 p-4 text-sm text-white/90"
            >
              Based on your current spending patterns, reducing discretionary
              expenses by ₹4,000 per month could increase your savings rate by
              ~6% annually.
            </motion.div>

          </div>

          {/* INPUT BAR */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-4">

              <input
                type="text"
                placeholder="Ask a question about your finances..."
                className="flex-1 rounded-full bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-cyan-400/40"
              />

              <button
                className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-400/20 transition hover:scale-[1.05]"
              >
                Ask
              </button>

            </div>
          </div>

        </div>

      </div>
    </PageWrapper>
  );
}
