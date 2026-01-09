# 🤖 AI Integration Setup Guide

## Overview
FinSight now includes **AI-powered financial analysis** that provides insights after simulations, forecasting, and portfolio optimization. The AI analyzes your results and explains them in simple, actionable terms.

## 🎯 Features

### After Simulation
- Risk assessment based on the Monte Carlo results
- What's likely to happen in most scenarios
- Recommendations to improve outcomes

### After Forecasting
- Trend analysis (up, down, or stable)
- Confidence level for the forecast
- Potential factors affecting accuracy
- Action recommendations

### After Portfolio Optimization
- Portfolio classification (balanced, aggressive, conservative)
- Asset role identification (core vs satellite)
- Concentration risk analysis
- Rebalancing recommendations

## 🔧 Setup Instructions

### Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API keys** → [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Copy the key (you won't see it again!)

### Step 2: Add API Key to Your Project

**Option A: Using .env file (Recommended for local development)**

1. In the `frontend` folder, create a file named `.env.local`
2. Add this line:
```env
VITE_OPENAI_API_KEY=sk_your_actual_api_key_here
```

3. Replace `sk_your_actual_api_key_here` with your actual OpenAI API key

**Option B: Using .env.example**

1. Copy the `.env.example` file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your API key

### Step 3: Verify Setup

1. Start the frontend development server:
```bash
cd frontend
npm run dev
```

2. Go to Simulation, Forecast, or Optimize page
3. Run an analysis
4. You should see "🤖 AI Financial Analysis" appear below the results
5. Click "View AI Analysis" to see the insights

## 📝 Example Usage

### Simulation Page Flow:
```
1. Enter simulation parameters (initial investment, monthly contribution, etc.)
2. Click "Run Simulation"
3. Chart appears with worst/median/best case scenarios
4. AI Analysis automatically loads below
5. See "View AI Analysis" button
6. Click to see AI's interpretation of your simulation
```

### Forecast Page Flow:
```
1. Select a CSV column with historical data
2. Enter number of forecast steps
3. Click "Run Forecast"
4. Chart shows historical + forecasted values
5. AI Analysis appears with trend analysis
6. Get actionable insights about the forecast
```

### Optimize Page Flow:
```
1. Upload portfolio data with assets and returns
2. Click "Run Optimization"
3. See optimized weights in pie chart
4. AI Analysis provides portfolio strategy insights
5. Understand if it's aggressive/conservative
```

## 💰 Pricing & Costs

- **GPT-3.5 Turbo** costs ~$0.0015 per request
- **Typical analysis**: 50-200 tokens = $0.000075 - $0.0003
- **Free trial**: $5 credit (good for ~3,000+ analyses)

## 🔒 Security Notes

⚠️ **IMPORTANT:**
- Never commit your API key to GitHub
- `.env.local` is already in `.gitignore`
- Keep your API key private and secure
- If exposed, regenerate the key immediately from OpenAI dashboard

## 🛠️ Troubleshooting

### "OpenAI API key not configured" Error
**Solution:** Make sure `.env.local` file exists in the `frontend` folder with your API key

### "Failed to get AI analysis" Error
**Possible causes:**
1. Invalid API key
2. API key doesn't have credits
3. Network connectivity issue
4. API rate limit exceeded

**Solution:** Check your OpenAI dashboard to verify:
- API key is valid
- Account has available credits
- No rate limits are being exceeded

### AI response is slow
- Normal: Takes 2-5 seconds to get analysis
- This is expected with GPT-3.5 Turbo

## 📚 File Structure

```
frontend/
├── .env.local (your API key - don't commit!)
├── .env.example (template)
├── src/
│   ├── services/
│   │   └── aiService.js (AI integration logic)
│   ├── components/
│   │   └── AIInsights.jsx (displays AI analysis)
│   └── pages/
│       ├── Simulation.jsx (with AI)
│       ├── Forecast.jsx (with AI)
│       └── Optimize.jsx (with AI)
```

## 🎨 AI Analysis UI

The AI analysis appears as:
- **Purple/Cyan gradient box** below your charts
- **🤖 Icon** in the header
- **"View AI Analysis" button** to expand/collapse
- **"Refresh Analysis" button** to regenerate
- **"Dismiss" button** to hide

## 🚀 Next Steps

1. Get your OpenAI API key
2. Create `.env.local` file
3. Add your API key
4. Run an analysis
5. Enjoy AI-powered financial insights! 🎉

## 📞 Support

- OpenAI Docs: https://platform.openai.com/docs
- API Status: https://status.openai.com/
- Pricing: https://openai.com/pricing

---

**Happy analyzing!** Your AI advisor is ready to help. 🤖📊
