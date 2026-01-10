import axios from "axios";
const USE_MOCK_API = false; // Changed to false to use real backend


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
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

// Analytics endpoints
export const getAnalyticsCategories = () => api.get("/api/analytics/categories");
export const getAnalyticsCashflow = () => api.get("/api/analytics/cashflow");
export const getAnalyticsVolatility = () => api.get("/api/analytics/volatility");
export const getAnalyticsNetworth = (initial=100000) => api.get("/api/analytics/networth", { params: { initial } });
export const getScore = () => api.get("/api/score");

export const getDashboardSummary = async () => {
  if (USE_MOCK_API) {
    return {
      net_worth: 1450000,

      accounts: [
        { id: "all", name: "All Accounts", net_worth: 1450000 },
        { id: "savings", name: "Savings Account", net_worth: 420000 },
        { id: "credit", name: "Credit Card", net_worth: -35000 },
        { id: "investments", name: "Investments", net_worth: 1065000 },
      ],

      months: ["Nov 2024", "Dec 2024", "Jan 2025"],

      monthly_data: {
        "Jan 2025": {
          expenses: 32400,
          transactions: [
            {
              date: "2025-01-03",
              description: "Zomato",
              category: "Food & Dining",
              amount: -450,
            },
            {
              date: "2025-01-05",
              description: "Rent",
              category: "Housing",
              amount: -15000,
            },
            {
              date: "2025-01-09",
              description: "Amazon",
              category: "Shopping",
              amount: -2800,
            },
          ],
        },

        "Dec 2024": {
          expenses: 29800,
          transactions: [
            {
              date: "2024-12-02",
              description: "Swiggy",
              category: "Food & Dining",
              amount: -620,
            },
            {
              date: "2024-12-12",
              description: "Electricity Bill",
              category: "Utilities",
              amount: -1800,
            },
          ],
        },
      },
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
  return api.get("/api/score");
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
