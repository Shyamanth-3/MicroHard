/**
 * AI Analysis Service
 * Integrates with Google Gemini to analyze financial data and graphs
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent";

export const AIService = {
  /**
   * Analyze Monte Carlo simulation results
   */
  async analyzeSimulation(data) {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        error: "Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env",
      };
    }

    const prompt = `
You are a financial advisor AI. Analyze this Monte Carlo simulation result and provide insights in a professional but accessible way.

Simulation Results:
- Initial Investment: $${data.initial?.toLocaleString() || 'N/A'}
- Monthly Contribution: $${data.monthly?.toLocaleString() || 'N/A'}
- Time Period: ${data.years} years
- Simulation Paths: ${data.paths}
- Expected Annual Return (Mean): ${(data.mean * 100).toFixed(2)}%
- Return Volatility (Std Dev): ${(data.std * 100).toFixed(2)}%

Worst Case (5th percentile) Final Value: $${data.worstFinal?.toLocaleString() || 'N/A'}
Median Case (50th percentile) Final Value: $${data.medianFinal?.toLocaleString() || 'N/A'}
Best Case (95th percentile) Final Value: $${data.bestFinal?.toLocaleString() || 'N/A'}

Please provide:
1. A brief summary of what these results mean
2. Risk assessment (is this conservative or aggressive?)
3. What's likely to happen in most scenarios
4. Key takeaways and recommendations
5. One actionable tip to improve outcomes

Keep the response concise (150-200 words), professional, and easy to understand for a non-expert.
    `;

    return callOpenAI(prompt);
  },

  /**
   * Analyze forecasting results
   */
  async analyzeForecast(data) {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        error: "Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env",
      };
    }

    const pastData = data.past || [];
    const forecastData = data.preds || [];
    const lastValue = pastData[pastData.length - 1];
    const forecastedValue = forecastData[forecastData.length - 1];
    const percentChange = lastValue
      ? (((forecastedValue - lastValue) / lastValue) * 100).toFixed(2)
      : 0;

    const prompt = `
You are a financial analyst AI. Analyze this time series forecast and provide insights.

Historical Data Points: ${pastData.length}
Last Known Value: ${lastValue?.toFixed(2) || 'N/A'}

Forecast for Next ${forecastData.length} periods:
${forecastData.map((v, i) => `Period ${i + 1}: ${v?.toFixed(2) || 'N/A'}`).join('\n')}

Forecasted Final Value: ${forecastedValue?.toFixed(2) || 'N/A'}
Projected Change: ${percentChange}%

Please provide:
1. What does this forecast suggest about future movement?
2. Is the trend up, down, or stable?
3. How confident should we be in this forecast?
4. What factors could cause deviations?
5. What action would you recommend based on this forecast?

Keep the response concise (150-200 words), professional, and practical.
    `;

    return callOpenAI(prompt);
  },

  /**
   * Analyze portfolio optimization results
   */
  async analyzeOptimization(data) {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        error: "Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env",
      };
    }

    const weightDetails = data.assets
      .map((asset, i) => `${asset}: ${(data.weights[i] * 100).toFixed(2)}%`)
      .join('\n');

    const prompt = `
You are a portfolio manager AI. Analyze this optimized portfolio allocation and provide insights.

Optimized Portfolio Weights:
${weightDetails}

Expected Portfolio Return: ${(data.expectedReturn * 100).toFixed(2)}%
Overall Risk Level: ${data.riskLevel || 'Moderate'}
Number of Assets: ${data.assets.length}

Please provide:
1. Is this a balanced, aggressive, or conservative portfolio?
2. Which assets are core holdings and which are satellite positions?
3. Are there any concentration risks?
4. How should this portfolio be rebalanced (timeframe)?
5. What market conditions would hurt/help this allocation?

Keep the response concise (150-200 words), professional, and focused on portfolio strategy.
    `;

    return callOpenAI(prompt);
  },

  /**
   * Ask a custom financial question with context
   */
  async askQuestion(question, context = {}) {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        error: "Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env",
      };
    }

    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const prompt = `
You are a professional financial advisor AI helping with investment and portfolio questions.

Context:
${contextStr || 'No additional context'}

User Question: ${question}

Please provide a helpful, professional, and practical response. Keep it concise (150-200 words).
    `;

    return callOpenAI(prompt);
  },

  /**
   * Summarize dashboard charts for user
   */
  async summarizeDashboard(chartData) {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        error: "Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env",
      };
    }

    const { categories, cashflow, score } = chartData;

    const categoryText = categories?.length > 0
      ? categories.map(c => `${c.category}: ₹${Math.abs(c.total || 0).toLocaleString()}`).join(", ")
      : "No category data";

    const cashflowText = cashflow?.length > 0
      ? cashflow.map(c => `${c.month}: Income ₹${(c.income || 0).toLocaleString()}, Expenses ₹${(c.expenses || 0).toLocaleString()}`).join("; ")
      : "No cashflow data";

    const prompt = `
You are a friendly financial advisor. Summarize this financial dashboard data in simple, easy-to-understand language. Use relevant emojis to make it engaging and visual.

SPENDING BY CATEGORY:
${categoryText}

INCOME vs EXPENSES:
${cashflowText}

CONFIDENCE SCORE: ${score?.score || 0}/100
MAIN RISK: ${score?.main_risk || "N/A"}

Please provide a 2-3 sentence summary that:
1. Highlights the biggest spending categories
2. Comments on income vs expenses trend
3. Gives one positive insight
4. Uses relevant emojis (💰, 📊, 📈, 💸, etc.)

Keep it casual, friendly, and motivating!`;

    return callOpenAI(prompt);
  },

  /**
   * Summarize simulation results for user
   */
  async summarizeSimulation(simulationData) {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        error: "Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env",
      };
    }

    const prompt = `
You are a friendly financial advisor explaining a Monte Carlo simulation to a non-expert user. Be clear, optimistic, and actionable.

THE 3 LINES ON THE CHART MEAN:
- RED (Worst Case/5th percentile): In the worst 5% of scenarios, you'd have ₹${simulationData.worstFinal?.toLocaleString() || 'N/A'}
- GREEN (Median/50th percentile): In a typical scenario, you'd have ₹${simulationData.medianFinal?.toLocaleString() || 'N/A'}
- BLUE (Best Case/95th percentile): In the best 5% of scenarios, you'd have ₹${simulationData.bestFinal?.toLocaleString() || 'N/A'}

YOUR PLAN DETAILS:
- Starting Amount: ₹${simulationData.initial?.toLocaleString()}
- Monthly Contribution: ₹${simulationData.monthly?.toLocaleString()}
- Time Period: ${simulationData.years} years
- Expected Annual Return: ${(simulationData.mean * 100).toFixed(1)}%
- Risk Level: ${(simulationData.std * 100).toFixed(1)}% volatility
- Success Rate: ${(simulationData.successRate * 100).toFixed(0)}% of scenarios show growth

IMPORTANT: Explain to the user in simple terms:
1. What the 3 lines mean in human language (not technical)
2. Whether the success rate is good/bad/excellent
3. What the spread between worst and best cases tells us about risk
4. One specific actionable tip to improve outcomes

Use emojis to make it engaging: 📈 📉 💰 ⚠️ ✅ 🎯 💪
Keep it 4-5 sentences, conversational, and motivating!`;

    return callOpenAI(prompt);
  },

  /**
   * Analyze and summarize forecast trends
   */
  async summarizeForecast(forecastText) {
    if (!GEMINI_API_KEY) {
      return "AI analysis unavailable. Please configure Gemini API key.";
    }

    const prompt = `
You are a friendly financial advisor. Analyze this forecast data and provide insights in simple, conversational language with relevant emojis.

FORECAST DATA:
${forecastText}

Please provide a concise 2-3 sentence analysis that:
1. Explains the trend in simple language
2. Indicates if it's growing/declining/stable
3. Gives one actionable insight or recommendation
4. Uses relevant emojis (💰, 📈, 📉, 💸, ⚠️, ✅, 🎯, etc.)

Make it friendly and motivating, not technical!`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a professional financial advisor AI. ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate analysis";
    } catch (error) {
      console.error("Forecast analysis error:", error);
      return "Unable to analyze forecast at this time.";
    }
  },
};

/**
 * Call Google Gemini API
 */
async function callOpenAI(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a professional financial advisor AI with expertise in portfolio management, forecasting, and risk analysis. Provide clear, concise, and actionable insights.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || error.message || "Gemini API error"
      );
    }

    const data = await response.json();
    const analysis =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!analysis) {
      throw new Error("No response from Gemini API");
    }

    return {
      success: true,
      analysis: analysis.trim(),
      error: null,
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      success: false,
      error: error.message || "Failed to get AI analysis",
      analysis: null,
    };
  }
}

export default AIService;
