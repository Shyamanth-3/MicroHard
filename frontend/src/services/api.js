import axios from "axios";
const USE_MOCK_API = true; // <-- change to false when backend is ready


const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const uploadCSV = (data) => api.post("/api/upload", data);
export const listUploads = () => api.get('/api/uploads');
export const getUploadColumns = (filename) => api.get(`/api/uploads/${filename}/columns`);
export const getUploadColumnValues = (filename, name) => api.get(`/api/uploads/${filename}/column`, { params: { name } });
export const forecast = (data) => api.post("/api/forecast", data);
export const monteCarlo = (data) => api.post("/api/monte-carlo", data);
export const optimize = (data) => api.post("/api/optimize", data);
export const savePortfolio = (data) => api.post("/api/save-portfolio", data);
export const runSimulation = (data) =>
  api.post("/api/monte-carlo", data);
export const runForecast = (data) =>
  api.post("/api/forecast", data);

// ===============================
// NEW APIs — Updated Feature Plan
// ===============================

export const getDashboardSummary = async () => {
  if (USE_MOCK_API) {
    return {
      total_income: 85000,
      total_expense: 52000,
      net_worth: 1450000,
      confidence_score: 74,
      main_risk: "Expense volatility",
    };
  }
  return api.get("/api/dashboard-summary");
};

export const getConfidenceScore = async () => {
  if (USE_MOCK_API) {
    return {
      score: 74,
      main_risk: "Income volatility",
      explanation: "Savings fluctuate month to month",
    };
  }
  return api.get("/api/confidence-score");
};

export const runMonteCarloSimulation = async (data) => {
  if (USE_MOCK_API) {
    return {
      worst: [8.2, 8.9, 9.5],
      median: [12.4, 13.5, 14.6],
      best: [17.8, 19.6, 21.3],
      success_probability: 0.81,
    };
  }
  return api.post("/api/monte-carlo", data);
};

export const askAIExplanation = async (question) => {
  if (USE_MOCK_API) {
    return {
      answer:
        "Your plan is moderately strong but sensitive to early market downturns.",
      assumptions: ["5% inflation", "Stable income"],
      risks: ["Expense volatility"],
    };
  }
  return api.post("/api/ask-ai", { question });
};


export default api;
