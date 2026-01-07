import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import { useState } from "react";
import { askAIExplanation } from "../services/api";

export default function AskAI() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "👋 Hi! I’m FinSight AI. Ask me anything about your finances — forecasts, risks, or decisions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);

  const handleAsk = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setExplanation(null);

    try {
      const res = await askAIExplanation(input);
      const data = res.data || res;

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.answer },
      ]);

      setExplanation({
        assumptions: data.assumptions || [],
        risks: data.risks || [],
        nextSteps: [
          "Stabilize monthly savings",
          "Build emergency buffer",
          "Avoid aggressive risk in early years",
        ],
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ I couldn’t analyze that right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

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
          FinSight AI explains insights using your own financial data.
        </p>

        {/* CHAT CONTAINER */}
        <div className="flex h-[520px] flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">

          {/* CHAT MESSAGES */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                  msg.role === "user"
                    ? "ml-auto bg-white/10 text-white"
                    : "bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 text-white/90"
                }`}
              >
                {msg.text}
              </motion.div>
            ))}

            {loading && (
              <div className="text-white/60 text-sm">FinSight AI is thinking…</div>
            )}
          </div>

          {/* INPUT BAR */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your finances..."
                className="flex-1 rounded-full bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-cyan-400/40"
              />

              <button
                onClick={handleAsk}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-400/20 transition hover:scale-[1.05] disabled:opacity-50"
              >
                Ask
              </button>
            </div>
          </div>
        </div>

        {/* EXPLAINABILITY PANEL */}
        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">
              Why the AI said this
            </h3>

            <div className="grid gap-4 md:grid-cols-3 text-sm text-white/80">
              <div>
                <p className="font-semibold mb-1">Assumptions</p>
                <ul className="list-disc ml-4">
                  {explanation.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">Trade-offs</p>
                <ul className="list-disc ml-4">
                  {explanation.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">Next Steps</p>
                <ul className="list-disc ml-4">
                  {explanation.nextSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </PageWrapper>
  );
}
