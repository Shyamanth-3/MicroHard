import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AIService from "../services/aiService";

/**
 * AI Insights Component
 * Displays AI analysis of financial data
 */
export default function AIInsights({ type = "simulation", data, trigger = false }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (trigger && data) {
      generateAnalysis();
    }
  }, [trigger, data]);

  const generateAnalysis = async () => {
    if (!data) return;

    try {
      setLoading(true);
      setError(null);
      let result;

      switch (type) {
        case "simulation":
          result = await AIService.analyzeSimulation(data);
          break;
        case "forecast":
          result = await AIService.analyzeForecast(data);
          break;
        case "optimization":
          result = await AIService.analyzeOptimization(data);
          break;
        default:
          result = { success: false, error: "Unknown analysis type" };
      }

      if (result.success) {
        setAnalysis(result.analysis);
        setShowAnalysis(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || "Failed to generate analysis");
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading && !error) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl bg-gradient-to-br from-cyan-400/10 to-emerald-400/10 border border-cyan-400/30 p-8 shadow-lg shadow-cyan-400/10 mt-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">🤖</div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
          AI Financial Analysis
        </h3>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-3 py-6">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>
          </div>
          <p className="text-white/70">Analyzing your data with AI...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-300 text-sm">
            <strong>Analysis unavailable:</strong> {error}
          </p>
          <p className="text-red-300/70 text-xs mt-2">
            💡 Tip: Add your Gemini API key to .env.local file to enable AI analysis
          </p>
        </div>
      )}

      {/* Analysis Content */}
      {showAnalysis && analysis && (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/90 leading-relaxed text-sm whitespace-pre-wrap"
          >
            {analysis}
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={generateAnalysis}
              disabled={loading}
              className="text-xs px-4 py-2 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/30 transition disabled:opacity-50"
            >
              🔄 Refresh Analysis
            </button>
            <button
              onClick={() => setShowAnalysis(false)}
              className="text-xs px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 transition"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Expand Button (when collapsed) */}
      {!showAnalysis && analysis && !loading && (
        <motion.button
          onClick={() => setShowAnalysis(true)}
          className="w-full px-4 py-2 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-sm hover:bg-cyan-400/30 transition"
        >
          📖 View AI Analysis
        </motion.button>
      )}
    </motion.div>
  );
}
