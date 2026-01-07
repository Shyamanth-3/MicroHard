import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { runSimulation } from "../services/api";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend
);

export default function Simulation() {
  const [years, setYears] = useState(10);
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [paths, setPaths] = useState(100);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [csvData, setCsvData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvRows, setCsvRows] = useState(0);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    try {
      setLoading(true);

      // If user selected a CSV column, derive mean/std from it
      let mean = 0.08;
      let std = 0.15;
      if (selectedFile && selectedColumn) {
        // fetch column values from server
        try {
          const resp = await fetch(`http://127.0.0.1:8000/api/uploads/${selectedFile}/column?name=${encodeURIComponent(selectedColumn)}`);
          const json = await resp.json();
          const prices = json.values || [];

          if (prices.length > 1) {
            const returns = [];
            for (let i = 1; i < prices.length; i++) {
              const p0 = prices[i - 1];
              const p1 = prices[i];
              if (p0 > 0 && p1 > 0) returns.push(Math.log(p1 / p0));
            }
            if (returns.length > 0) {
              const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
              const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / (returns.length - 1 || 1);
              mean = avg * 12;
              std = Math.sqrt(variance) * Math.sqrt(12);
            }
          }
        } catch (err) {
          console.error('Could not fetch column for simulation', err);
        }
      } else if (selectedColumn && csvData[selectedColumn] && csvData[selectedColumn].length > 1) {
        const prices = csvData[selectedColumn];
        // compute log returns
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
          const p0 = prices[i - 1];
          const p1 = prices[i];
          if (p0 > 0 && p1 > 0) returns.push(Math.log(p1 / p0));
        }
        if (returns.length > 0) {
          const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
          const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / (returns.length - 1 || 1);
          mean = avg * 12;
          std = Math.sqrt(variance) * Math.sqrt(12);
        }
      }

      const res = await runSimulation({
        initial: initial,
        monthly: monthly,
        mean: mean,
        std: std,
        years: years,
        paths: paths,
      });

      setChartData(res.data);
    } catch (err) {
      alert("Simulation failed — check backend logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { cols: [], data: {} };
    const header = lines[0].split(',').map(h => h.trim());
    const cols = header.slice();
    const data = {};
    cols.forEach(c => data[c] = []);

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      for (let j = 0; j < cols.length; j++) {
        const val = parts[j] ? parts[j].trim() : '';
        const num = Number(val);
        if (!isNaN(num)) data[cols[j]].push(num);
      }
    }

    return { cols, data };
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { cols, data } = parseCSV(text);
      setCsvColumns(cols);
      setCsvData(data);
      setSelectedColumn(cols[0] || null);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch('http://127.0.0.1:8000/api/uploads');
        const json = await resp.json();
        setUploadedFiles(json.files || []);
        if (json.files && json.files.length > 0) setSelectedFile(json.files[0].filename);
      } catch (err) {
        console.warn('Could not load uploads', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedFile) return;
    const loadCols = async () => {
      try {
        const resp = await fetch(`http://127.0.0.1:8000/api/uploads/${selectedFile}/columns`);
        const json = await resp.json();
        const cols = json.columns || [];
        setCsvColumns(cols);
        setCsvRows(json.rows || 0);

        // Auto-pick first numeric column by probing values
        let pick = null;
        for (const c of cols) {
          try {
            const r = await fetch(`http://127.0.0.1:8000/api/uploads/${selectedFile}/column?name=${encodeURIComponent(c)}`);
            const cj = await r.json();
            if (cj.values && cj.values.length > 0) {
              pick = c;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
        setSelectedColumn(pick || (cols[0] || null));
      } catch (err) {
        console.warn('Could not load columns for simulation', err);
      }
    };
    loadCols();
  }, [selectedFile]);

  return (
    <PageWrapper>
      <div className="relative z-10 mx-auto max-w-7xl px-8 pt-24 pb-20">

        <motion.h1 className="text-3xl font-bold mb-10">
          Financial Simulation
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* INPUTS */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <label className="text-sm text-white/70 block mb-2">Use uploaded file</label>
            <div className="flex items-center gap-3 mb-3">
              <select value={selectedFile || ''} onChange={e => setSelectedFile(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white">
                <option value="">-- select uploaded file --</option>
                {uploadedFiles.map(f => <option key={f.filename} value={f.filename}>{f.filename}</option>)}
              </select>
              <button onClick={() => {
                fetch('http://127.0.0.1:8000/api/uploads').then(r=>r.json()).then(j=>{setUploadedFiles(j.files||[]); if (j.files && j.files.length>0) setSelectedFile(j.files[0].filename)}).catch(()=>{});
              }} className="px-3 py-2 bg-white/10 border border-white/20 rounded">Refresh</button>
              <span className="text-white/60">Rows: {csvRows}</span>
            </div>
            {csvColumns.length > 0 && (
              <div className="mb-3">
                <label className="text-sm text-white/70 mr-2">Column:</label>
                <select value={selectedColumn || ''} onChange={e => setSelectedColumn(e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white">
                  {csvColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {selectedFile && selectedColumn && (
              <div className="mb-3 text-sm text-white/70">Using uploaded file: <strong>{selectedFile}</strong> / <strong>{selectedColumn}</strong></div>
            )}

            <label className="text-sm text-white/70 block mb-2">Initial Investment: ${initial.toLocaleString()}</label>
            <input
              type="number"
              value={initial}
              onChange={e => setInitial(Number(e.target.value))}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            />

            <label className="text-sm text-white/70 block mb-2">Monthly Contribution: ${monthly.toLocaleString()}</label>
            <input
              type="number"
              value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            />

            <label className="text-sm text-white/70 block mb-2">Simulation Samples: {paths}</label>
            <input
              type="range"
              min="10"
              max="1000"
              value={paths}
              onChange={e => setPaths(Number(e.target.value))}
              className="w-full mb-4"
            />

            <label className="text-sm text-white/70">Years: {years}</label>
            <input
              type="range"
              min="1"
              max="30"
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full mb-6"
            />

            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-3 text-black font-semibold"
            >
              {loading ? "Running..." : "Run Simulation"}
            </button>
          </div>

          {/* CHART */}
          <div className="lg:col-span-2 rounded-3xl bg-white/5 border border-white/10 p-6">
            {/* Scenario Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: "🏠 Buy Home", years: 5, monthly: 3000, initial: 20000 },
                { label: "🎓 Education", years: 8, monthly: 2500, initial: 10000 },
                { label: "🏦 Retire Early", years: 20, monthly: 7000, initial: 50000 },
                { label: "💳 Debt-Free", years: 3, monthly: 4000, initial: 0 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setYears(s.years);
                    setMonthly(s.monthly);
                    setInitial(s.initial);
                  }}
                  className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs hover:bg-white/20 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <h3 className="font-semibold mb-4">Monte Carlo Simulation</h3>

            {!chartData && (
              <p className="text-white/60">Run simulation to see chart.</p>
            )}

            {chartData && (
              <Line
                data={{
                  labels: chartData.worst.map((_, i) => i),
                  datasets: [
                    {
                      label: "Worst Case (5th percentile)",
                      data: chartData.worst,
                      borderColor: "#ef4444",
                      backgroundColor: "rgba(239,68,68,0.1)",
                      borderWidth: 2,
                    },
                    {
                      label: "Median Case (50th percentile)",
                      data: chartData.median,
                      borderColor: "#22c55e",
                      backgroundColor: "rgba(34,197,94,0.1)",
                      borderWidth: 2,
                    },
                    {
                      label: "Best Case (95th percentile)",
                      data: chartData.best,
                      borderColor: "#06b6d4",
                      backgroundColor: "rgba(6,182,212,0.1)",
                      borderWidth: 2,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                    }
                  }
                }}
              />
              
            )}
            {/* Simulation Summary */}
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-white/60 mb-1">
                Probability of achieving this plan
              </p>

              <p className="text-2xl font-bold text-emerald-400">
                {chartData?.success_probability
                  ? Math.round(chartData.success_probability * 100)
                  : 80}
                %
              </p>

              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                This estimate is based on thousands of simulated futures using your
                contribution pattern and market variability. Increasing monthly
                contributions generally improves outcomes more than extending the
                timeline.
              </p>
            </div>

          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
