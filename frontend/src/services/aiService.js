const API_BASE = import.meta.env.VITE_API_URL;

export const AIService = {
  async ask(question) {
    const res = await fetch(`${API_BASE}/api/ask-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    return res.json();
  },

  async summarizeDashboard(data) {
    const prompt = `
You are a financial analyst AI.

Given this user's financial dashboard data:
${JSON.stringify(data, null, 2)}

Provide:
- A concise summary
- Key insights
- One risk
- One actionable recommendation

Keep it clear and non-technical.
`;

    const res = await fetch(`${API_BASE}/api/ask-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: prompt }),
    });

    return res.json();
  }
};
