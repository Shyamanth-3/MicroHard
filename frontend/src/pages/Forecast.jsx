import PageWrapper from "../components/PageWrapper";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import { runForecast } from "../services/api";
import { AIService } from "../services/aiService";
import ActiveDataset from "../components/ActiveDataset";


export default function ForecastPage() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [steps, setSteps] = useState(8);
  const [incomeForecast, setIncomeForecast] = useState(null);
  const [expenseForecast, setExpenseForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("10,12,15,14,18");
  const [useManualInput, setUseManualInput] = useState(false);
  const [interpretAsExpense, setInterpretAsExpense] = useState(false);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load uploaded files on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const resp = await fetch("http://127.0.0.1:8000/api/uploads");
        const json = await resp.json();
        setUploadedFiles(json.files || []);
        if (json.files && json.files.length > 0) {
          setSelectedFile(json.files[0].filename);
        }
      } catch (err) {
        console.warn("Could not load uploads", err);
      }
    };
    loadFiles();
  }, []);

  // Load columns when file is selected
  useEffect(() => {
    if (!selectedFile) return;

    const loadColumns = async () => {
      try {
        const resp = await fetch(
          `http://127.0.0.1:8000/api/uploads/${selectedFile}/columns`
        );
        const json = await resp.json();
        const cols = json.columns || [];
        setColumns(cols);
        
        // Auto-select amount column
        const amountCol = cols.find(c => 
          c.toLowerCase().includes("amount") || 
          c.toLowerCase().includes("value") ||
          c.toLowerCase().includes("income")
        );
        setSelectedColumn(amountCol || (cols[0] || null));
      } catch (err) {
        console.warn("Could not load columns", err);
        setError("Failed to load columns from file");
      }
    };
    loadColumns();
  }, [selectedFile]);

  // Load column data when column is selected
  useEffect(() => {
    if (!selectedFile || !selectedColumn || useManualInput) return;

    const loadColumnData = async () => {
      try {
        // Try to fetch transaction amounts from database (which have proper income/expense signs)
        try {
          const txResp = await fetch(`http://127.0.0.1:8000/api/transactions`);
          if (txResp.ok) {
            const txData = await txResp.json();
            if (txData && Array.isArray(txData) && txData.length > 0) {
              // Extract amounts from transactions (should have: positive=income, negative=expense)
              let values = txData.map(tx => tx.amount);
              console.log("✓ Using transaction amounts from database:", values.length, "records");
              
              // Check if we have both income and expense
              const incomeCount = values.filter(v => v > 0).length;
              const expenseCount = values.filter(v => v < 0).length;
              console.log(`Income: ${incomeCount}, Expense: ${expenseCount}`);
              
              // If no expenses, check the type field to apply sign logic
              if (expenseCount === 0) {
                console.warn("⚠️ All amounts are positive. Checking type field...");
                values = txData.map(tx => {
                  const type = String(tx.type || "").toLowerCase();
                  if (type.includes("expense")) {
                    return -Math.abs(tx.amount);
                  }
                  return Math.abs(tx.amount);
                });
                console.log("Applied type-based sign correction. New counts:", values.filter(v => v > 0).length, "income,", values.filter(v => v < 0).length, "expense");
              }
              
              setCsvData(values);
              
              // Calculate monthly averages for income and expenses
              const monthlyIncome = calculateMonthlyAveragesWithType(values, [], true);
              const monthlyExpenses = calculateMonthlyAveragesWithType(values, [], false);
              
              console.log("Income months:", monthlyIncome.length, monthlyIncome.slice(0, 3));
              console.log("Expense months:", monthlyExpenses.length, monthlyExpenses.slice(0, 3));
              
              // Auto-run forecasts if we have data
              setLoading(true);
              setError(null);
              try {
                if (monthlyIncome.length > 0) {
                  await runAutoForecast(monthlyIncome, true);
                } else {
                  console.warn("No income data for forecast");
                }
                if (monthlyExpenses.length > 0) {
                  await runAutoForecast(monthlyExpenses, false);
                } else {
                  console.warn("No expense data for forecast");
                }
              } catch (err) {
                setError("Forecast failed: " + err.message);
                console.error(err);
              } finally {
                setLoading(false);
              }
              return;
            }
          }
        } catch (err) {
          console.warn("Could not fetch from /api/transactions:", err);
        }
        
        // Fallback: Fetch amount values from CSV
        const resp = await fetch(
          `http://127.0.0.1:8000/api/uploads/${selectedFile}/column?name=${encodeURIComponent(selectedColumn)}`
        );
        const json = await resp.json();
        const values = json.values || [];

        // Try to fetch a type/category column to infer signs
        let typeValues = [];
        try {
          const typeCol = (columns || []).find(c => {
            const lc = c.toLowerCase();
            return lc.includes("type") || lc.includes("transaction type") || lc.includes("category");
          });
          if (typeCol) {
            const tr = await fetch(
              `http://127.0.0.1:8000/api/uploads/${selectedFile}/column?name=${encodeURIComponent(typeCol)}`
            );
            const tj = await tr.json();
            typeValues = (tj.values || []).map(v => String(v));
          }
        } catch (e) {
          console.warn("Could not load type/category column:", e);
        }

        setCsvData(values);
        
        // Calculate monthly averages for income and expenses (use type info if available)
        const monthlyIncome = calculateMonthlyAveragesWithType(values, typeValues, true);
        const monthlyExpenses = calculateMonthlyAveragesWithType(values, typeValues, false);
        
        // Auto-run forecasts if we have data
        setLoading(true);
        setError(null);
        try {
          if (monthlyIncome.length > 0 || monthlyExpenses.length > 0) {
            if (monthlyIncome.length > 0) {
              await runAutoForecast(monthlyIncome, true);
            } else {
              setIncomeForecast(null);
            }
            if (monthlyExpenses.length > 0) {
              await runAutoForecast(monthlyExpenses, false);
            } else {
              setExpenseForecast(null);
            }
          } else {
            // No sign info; use toggle to interpret values as either income or expenses
            const monthly = calculateMonthlyAveragesSimple(values);
            if (interpretAsExpense) {
              setIncomeForecast(null);
              await runAutoForecast(monthly, false);
            } else {
              setExpenseForecast(null);
              await runAutoForecast(monthly, true);
            }
          }
        } catch (err) {
          setError("Forecast failed: " + err.message);
          console.error(err);
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.warn("Could not load data", err);
        setError("Failed to load data");
      }
    };
    loadColumnData();
  }, [selectedFile, selectedColumn, useManualInput]);

  const calculateMonthlyAveragesWithType = (values, typeValues, isIncome) => {
    if (!values || values.length === 0) return [];
    
    let filteredValues = [];

    // If type/category info is provided, derive sign from it
    if (typeValues && typeValues.length === values.length) {
      const signed = values.map((v, i) => {
        const t = String(typeValues[i] || '').toLowerCase();
        const isExpenseLike = t.includes('expense') || t.includes('debit') || t.includes('withdraw');
        const isIncomeLike = t.includes('income') || t.includes('credit') || t.includes('deposit') || t.includes('salary');
        if (isExpenseLike) return -Math.abs(Number(v));
        if (isIncomeLike) return Math.abs(Number(v));
        // fallback: keep as-is
        return Number(v);
      });
      filteredValues = isIncome
        ? signed.filter(v => v > 0)
        : signed.filter(v => v < 0).map(v => Math.abs(v));
    } else {
      // Use sign-based filtering: positive = income, negative = expense
      filteredValues = isIncome 
        ? values.filter(v => v > 0) 
        : values.filter(v => v < 0).map(v => Math.abs(v));
    }
    
    if (filteredValues.length === 0) {
      console.warn(`⚠️ No ${isIncome ? 'income' : 'expense'} data found (looking for ${isIncome ? 'positive' : 'negative'} values)`);
      return [];
    }
    
    console.log(`${isIncome ? '💰 Income' : '💸 Expense'}: ${filteredValues.length} records found`);
    
    // If we have 12 or fewer values, assume they're already aggregated
    if (filteredValues.length <= 12) {
      return filteredValues;
    }
    
    // Calculate monthly averages from larger dataset
    const dataToUse = filteredValues.slice(-365); // Last year of data
    const monthlyData = [];
    const pointsPerMonth = Math.ceil(dataToUse.length / 12);
    
    for (let i = 0; i < 12; i++) {
      const start = i * pointsPerMonth;
      const end = Math.min(start + pointsPerMonth, dataToUse.length);
      const monthValues = dataToUse.slice(start, end);
      
      if (monthValues.length > 0) {
        const avg = monthValues.reduce((a, b) => a + b, 0) / monthValues.length;
        monthlyData.push(Math.round(avg * 100) / 100);
      }
    }
    
    return monthlyData.length > 0 ? monthlyData : filteredValues;
  };

  const calculateMonthlyAveragesSimple = (values) => {
    if (!values || values.length === 0) return [];
    const absVals = values.map(v => Math.abs(Number(v))).filter(v => !isNaN(v));
    if (absVals.length <= 12) return absVals;
    const dataToUse = absVals.slice(-365);
    const monthlyData = [];
    const pointsPerMonth = Math.ceil(dataToUse.length / 12);
    for (let i = 0; i < 12; i++) {
      const start = i * pointsPerMonth;
      const end = Math.min(start + pointsPerMonth, dataToUse.length);
      const monthValues = dataToUse.slice(start, end);
      if (monthValues.length > 0) {
        const avg = monthValues.reduce((a, b) => a + b, 0) / monthValues.length;
        monthlyData.push(Math.round(avg * 100) / 100);
      }
    }
    return monthlyData.length > 0 ? monthlyData : absVals;
  };

  const runAutoForecast = async (values, isIncome) => {
    if (!values || values.length === 0) {
      return;
    }

    try {
      const res = await runForecast({ values, steps });
      const forecastData = { past: values, preds: res.data.forecast };
      
      if (isIncome) {
        setIncomeForecast(forecastData);
      } else {
        setExpenseForecast(forecastData);
      }
    } catch (err) {
      console.error("Forecast error:", err);
      throw err;
    }
  };

  const handleManualForecast = async () => {
    setError(null);
    const numbers = input.split(",").map(n => Number(n.trim()));
    if (!numbers.length || numbers.some(isNaN)) {
      setError("Enter valid numeric values");
      return;
    }

    setLoading(true);
    try {
      const res = await runForecast({ values: numbers, steps });
      setForecast({ past: numbers, preds: res.data.forecast });
    } catch (err) {
      setError("Forecast failed");
    } finally {
      setLoading(false);
    }
  };

  const getTrendStrength = (forecast) => {
    if (!forecast) return "";
    const delta = forecast.preds.at(-1) - forecast.past[0];
    if (delta > 0.5) return "🚀 Strong Upward Trend";
    if (delta > 0.1) return "📈 Moderate Growth";
    if (delta > -0.1) return "➖ Mostly Flat";
    return "📉 Downward Trend";
  };

  const getRange = (forecast) => {
    if (!forecast) return null;
    const base = forecast.preds.at(-1);
    return { low: base * 0.9, high: base * 1.1 };
  };

  const analyzeForecastsWithAI = async () => {
    if (!incomeForecast && !expenseForecast) return;
    
    setAiLoading(true);
    try {
      if (incomeForecast) {
        const incomeText = `
Income Forecast Analysis:
- Historical data: ${incomeForecast.past.join(", ")}
- Trend: ${getTrendStrength(incomeForecast)}
- Last value: $${incomeForecast.past[incomeForecast.past.length - 1].toFixed(2)}
- Next prediction: $${incomeForecast.preds[0].toFixed(2)}
- Full forecast: ${incomeForecast.preds.map(p => p.toFixed(2)).join(", ")}
- Average: $${(incomeForecast.past.reduce((a, b) => a + b) / incomeForecast.past.length).toFixed(2)}

Please provide a brief, friendly analysis of this income forecast in 2-3 sentences with relevant emojis. Include: 1) What the trend shows, 2) Is income growing or declining?, 3) One actionable insight.`;
        
        const incomeSummaryText = await AIService.summarizeForecast(incomeText);
        setIncomeSummary(incomeSummaryText);
      }

      if (expenseForecast) {
        const expenseText = `
Expense Forecast Analysis:
- Historical data: ${expenseForecast.past.join(", ")}
- Trend: ${getTrendStrength(expenseForecast)}
- Last value: $${expenseForecast.past[expenseForecast.past.length - 1].toFixed(2)}
- Next prediction: $${expenseForecast.preds[0].toFixed(2)}
- Full forecast: ${expenseForecast.preds.map(p => p.toFixed(2)).join(", ")}
- Average: $${(expenseForecast.past.reduce((a, b) => a + b) / expenseForecast.past.length).toFixed(2)}

Please provide a brief, friendly analysis of this expense forecast in 2-3 sentences with relevant emojis. Include: 1) What the trend shows, 2) Are expenses increasing or decreasing?, 3) One spending control recommendation.`;
        
        const expenseSummaryText = await AIService.summarizeForecast(expenseText);
        setExpenseSummary(expenseSummaryText);
      }
    } catch (err) {
      console.error("AI analysis failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-analyze when forecasts load
  useEffect(() => {
    if (incomeForecast || expenseForecast) {
      analyzeForecastsWithAI();
    }
  }, [incomeForecast, expenseForecast]);

  // Recompute forecast whenever the toggle changes (CSV mode)
  useEffect(() => {
    if (!useManualInput && csvData) {
      (async () => {
        try {
          setLoading(true);
          const monthly = calculateMonthlyAveragesSimple(csvData);
          if (interpretAsExpense) {
            setIncomeForecast(null);
            await runAutoForecast(monthly, false);
          } else {
            setExpenseForecast(null);
            await runAutoForecast(monthly, true);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [interpretAsExpense, csvData, useManualInput]);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-8 pt-24 pb-20">

        <motion.h1 className="text-3xl font-bold mb-3">
          💰 Forecast
        </motion.h1>
        <ActiveDataset />


        <p className="text-sm text-white/70 mb-10 max-w-2xl">
          Forecast shows your monthly income and expenses trends for the last year.
          Monitor both to understand your financial health and control spending.
        </p>

        {/* FILE & COLUMN SELECTORS */}
        {!useManualInput && uploadedFiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

            {/* File Selector */}
            <div>
              <label className="text-sm text-white/70 block mb-2">
                📁 Select File
              </label>
              <select
                value={selectedFile || ""}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:outline-none"
              >
                {uploadedFiles.map((f) => (
                  <option key={f.filename} value={f.filename}>
                    {f.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Column Selector */}
            <>
              {columns.length > 0 && (
                <div>
                  <label className="text-sm text-white/70 block mb-2">
                    📊 Select Column
                  </label>

                  <select
                    value={selectedColumn || ""}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>

                  {csvData && (
                    <p className="text-xs text-cyan-300 mt-1">
                      ✓ {csvData.length} records →{" "}
                      {incomeForecast ? incomeForecast.past.length : 0} months
                    </p>
                  )}

                  {/* Interpret toggle */}
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-sm text-white/70">Treat selected column as</label>
                    <button
                      onClick={() => setInterpretAsExpense(v => !v)}
                      className={`rounded-full px-4 py-1 text-xs font-semibold border transition ${interpretAsExpense ? 'bg-red-500/20 border-red-400 text-red-200' : 'bg-green-500/20 border-green-400 text-green-200'}`}
                    >
                      {interpretAsExpense ? 'Expenses' : 'Income'}
                    </button>
                  </div>
                </div>
              )}
            </>

            {/* Manual Input Toggle */}
            <div>
              <label className="text-sm text-white/70 block mb-2">Mode</label>
              <button
                onClick={() => setUseManualInput(!useManualInput)}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white hover:bg-white/20 transition"
              >
                {useManualInput ? "📁 Use File Data" : "✏️ Manual Input"}
              </button>
            </div>

          </div>
        )}

        {/* MANUAL INPUT MODE */}
        {useManualInput && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2">
              <label className="text-sm text-white/70 block mb-2">Enter values (comma-separated)</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="10,12,15,14,18"
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white focus:outline-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm text-white/70 block mb-2">Mode</label>
              <button
                onClick={() => setUseManualInput(false)}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white hover:bg-white/20 transition mb-2"
              >
                📁 Use File Data
              </button>
              <button
                onClick={handleManualForecast}
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3 text-black font-semibold disabled:opacity-50"
              >
                {loading ? "Running..." : "▶️ Run"}
              </button>
            </div>
          </div>
        )}

        {/* STEPS SLIDER */}
        <div className="mb-8">
          <label className="text-sm text-white/70 block mb-2">Forecast Steps: {steps}</label>
          <input
            type="range"
            min="1"
            max="24"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg p-4 mb-8">
            ⚠️ {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin text-6xl mb-4">🔮</div>
              <p className="text-white font-semibold">Generating forecast...</p>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {!loading && (
          <div className="space-y-8">
            {/* INCOME FORECAST */}
            {!interpretAsExpense && incomeForecast && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-6">
                  <h3 className="text-white font-semibold mb-4">📈 Income Forecast</h3>
                  <Line
                    data={{
                      labels: [
                        ...incomeForecast.past.map((_, i) => `T-${incomeForecast.past.length - i}`),
                        ...incomeForecast.preds.map((_, i) => `F+${i + 1}`),
                      ],
                      datasets: [
                        {
                          label: "Historical Income",
                          data: [...incomeForecast.past, null],
                          borderColor: "#10b981",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          borderWidth: 2,
                          pointRadius: 4,
                          tension: 0.3,
                        },
                        {
                          label: "Income Forecast",
                          data: [
                            ...Array(incomeForecast.past.length - 1).fill(null),
                            incomeForecast.past[incomeForecast.past.length - 1],
                            ...incomeForecast.preds,
                          ],
                          borderColor: "#34d399",
                          borderDash: [6, 4],
                          borderWidth: 2,
                          pointRadius: 3,
                          tension: 0.3,
                          fill: false,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          labels: { color: "#fff" },
                        },
                      },
                      scales: {
                        y: {
                          ticks: { color: "#aaa" },
                          grid: { color: "#444" },
                        },
                        x: {
                          ticks: { color: "#aaa" },
                          grid: { color: "#444" },
                        },
                      },
                    }}
                  />
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-green-400/30 bg-green-400/10 p-5">
                    <p className="text-sm text-green-200 mb-1">Trend</p>
                    <h3 className="text-lg font-semibold text-green-100">
                      {getTrendStrength(incomeForecast)}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                    <p className="text-sm text-emerald-200 mb-1">Expected Range</p>
                    <p className="text-sm text-white">
                      ${getRange(incomeForecast).low.toFixed(2)} – ${getRange(incomeForecast).high.toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/10 border border-white/20 p-3">
                      <p className="text-xs text-white/60">Current</p>
                      <p className="text-lg font-bold text-green-400">
                        ${incomeForecast.past[incomeForecast.past.length - 1].toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 border border-white/20 p-3">
                      <p className="text-xs text-white/60">Next Month</p>
                      <p className="text-lg font-bold text-green-300">
                        ${incomeForecast.preds[0].toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EXPENSES FORECAST */}
            {interpretAsExpense && expenseForecast && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-6">
                  <h3 className="text-white font-semibold mb-4">💸 Expenses Forecast</h3>
                  <Line
                    data={{
                      labels: [
                        ...expenseForecast.past.map((_, i) => `T-${expenseForecast.past.length - i}`),
                        ...expenseForecast.preds.map((_, i) => `F+${i + 1}`),
                      ],
                      datasets: [
                        {
                          label: "Historical Expenses",
                          data: [...expenseForecast.past, null],
                          borderColor: "#ef4444",
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          borderWidth: 2,
                          pointRadius: 4,
                          tension: 0.3,
                        },
                        {
                          label: "Expenses Forecast",
                          data: [
                            ...Array(expenseForecast.past.length - 1).fill(null),
                            expenseForecast.past[expenseForecast.past.length - 1],
                            ...expenseForecast.preds,
                          ],
                          borderColor: "#f87171",
                          borderDash: [6, 4],
                          borderWidth: 2,
                          pointRadius: 3,
                          tension: 0.3,
                          fill: false,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          labels: { color: "#fff" },
                        },
                      },
                      scales: {
                        y: {
                          ticks: { color: "#aaa" },
                          grid: { color: "#444" },
                        },
                        x: {
                          ticks: { color: "#aaa" },
                          grid: { color: "#444" },
                        },
                      },
                    }}
                  />
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
                    <p className="text-sm text-red-200 mb-1">Trend</p>
                    <h3 className="text-lg font-semibold text-red-100">
                      {getTrendStrength(expenseForecast)}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5">
                    <p className="text-sm text-orange-200 mb-1">Expected Range</p>
                    <p className="text-sm text-white">
                      ${getRange(expenseForecast).low.toFixed(2)} – ${getRange(expenseForecast).high.toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/10 border border-white/20 p-3">
                      <p className="text-xs text-white/60">Current</p>
                      <p className="text-lg font-bold text-red-400">
                        ${expenseForecast.past[expenseForecast.past.length - 1].toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 border border-white/20 p-3">
                      <p className="text-xs text-white/60">Next Month</p>
                      <p className="text-lg font-bold text-red-300">
                        ${expenseForecast.preds[0].toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EMPTY STATE */}
        {!incomeForecast && !expenseForecast && !loading && (
          <div className="rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-white font-semibold text-lg">
              {useManualInput
                ? "Enter values and click Run Forecast"
                : uploadedFiles.length === 0
                ? "Upload a CSV file first"
                : columns.length === 0
                ? "Select a file to load columns"
                : "Select a column to forecast income and expenses"}
            </p>
          </div>
        )}

      </div>
    </PageWrapper>
  );
}
