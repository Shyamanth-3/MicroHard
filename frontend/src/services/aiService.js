/**
 * AI Analysis Service
 * Frontend → Backend only (NO Gemini here)
 */

const API_BASE = import.meta.env.VITE_API_URL;

async function post(endpoint, payload) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "AI request failed");
  }

  return res.json();
}

export const AIService = {
  analyzeSimulation(data) {
    return post("/api/ai/analyze-simulation", data);
  },

  analyzeForecast(data) {
    return post("/api/ai/analyze-forecast", data);
  },

  analyzeOptimization(data) {
    return post("/api/ai/analyze-optimization", data);
  },

  askQuestion(question, context = {}) {
    return post("/api/ai/ask", { question, context });
  },

  summarizeDashboard(chartData) {
    return post("/api/ai/summarize-dashboard", chartData);
  },

  summarizeSimulation(simulationData) {
    return post("/api/ai/summarize-simulation", simulationData);
  },

  summarizeForecast(forecastText) {
    return post("/api/ai/summarize-forecast", { text: forecastText });
  },
};

export default AIService;
