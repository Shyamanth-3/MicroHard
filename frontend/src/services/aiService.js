import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

export const AIService = {
  ask: async (question) => {
    const res = await axios.post(`${API_BASE}/api/ask-ai`, {
      question,
    });
    return res.data;
  },

  summarizeDashboard: async ({ categories, cashflow, score }) => {
    const prompt = `
You are a financial analyst AI.

Here is the user's financial data:
- Categories: ${JSON.stringify(categories)}
- Cashflow: ${JSON.stringify(cashflow)}
- Confidence score: ${JSON.stringify(score)}

Give a short, clear dashboard summary with insights and risks.
`;

    const res = await axios.post(`${API_BASE}/api/ask-ai`, {
      question: prompt,
    });

    return res.data;
  },
};
