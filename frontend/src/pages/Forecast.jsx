import PageWrapper from "../components/PageWrapper";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import { runForecast } from "../services/api";

export default function ForecastPage() {
  const [input, setInput] = useState("10,12,15,14,18");
  const [steps, setSteps] = useState(8);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [csvData, setCsvData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvRows, setCsvRows] = useState(0);

  const handleRun = async () => {
    setError(null);
    let numbers;
    if (selectedFile && selectedColumn) {
      try {
        const resp = await fetch(`http://127.0.0.1:8000/api/uploads/${selectedFile}/column?name=${encodeURIComponent(selectedColumn)}`);
        const json = await resp.json();
        numbers = json.values || [];
      } catch (err) {
        console.error('Could not fetch column values', err);
        setError('Could not fetch selected column from server');
        return;
      }
    } else {
      numbers = input
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(Number);
    }

    if (numbers.length === 0 || numbers.some(isNaN)) {
      setError('Please provide a comma-separated list of numbers.');
      return;
    }

    setLoading(true);
    try {
      const res = await runForecast({ values: numbers, steps });
      const preds = res.data.forecast;
      setForecast({ past: numbers, preds });
    } catch (err) {
      console.error(err);
      setError('Forecast failed — check backend logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch uploaded files from backend
    const load = async () => {
      try {
        const resp = await fetch('http://127.0.0.1:8000/api/uploads');
        const json = await resp.json();
        setUploadedFiles(json.files || []);
        if (json.files && json.files.length > 0) {
          setSelectedFile(json.files[0].filename);
        }
      } catch (err) {
        console.warn('Could not load uploaded files', err);
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
        setCsvData({});
        setCsvRows(json.rows || 0);

        // Try to auto-pick a numeric column by probing column values
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
            // ignore and try next column
          }
        }

        setSelectedColumn(pick || (cols[0] || null));
      } catch (err) {
        console.warn('Could not load columns', err);
      }
    };
    loadCols();
  }, [selectedFile]);

  // Build combined chart data when forecast available
  const combinedChart = () => {
    if (!forecast) return null;
    const { past, preds } = forecast;
    const labels = [...past.map((_, i) => `T-${past.length - i}`), ...preds.map((_, i) => `F+${i + 1}`)];
    const pastX = Array.from({ length: past.length }, (_, i) => i);
    const futureX = Array.from({ length: preds.length }, (_, i) => past.length + i);

    return {
      labels,
      datasets: [
        {
          label: 'Historical',
          data: past,
          borderColor: '#94a3b8',
          backgroundColor: 'rgba(148,163,184,0.1)',
          tension: 0.2,
        },
        {
          label: 'Forecast',
          data: [...Array(past.length).fill(null), ...preds],
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.08)',
          borderDash: [6, 4],
          tension: 0.2,
        }
      ]
    };
  };

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-8 pt-24 pb-20">

        <h1 className="text-3xl font-bold mb-6">Forecast</h1>

        <div className="mb-4">
          <label className="text-sm text-white/70 block mb-2">Use uploaded file</label>
          <div className="flex items-center gap-3 mb-3">
            <select value={selectedFile || ''} onChange={e => setSelectedFile(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white">
              <option value="">-- select uploaded file --</option>
              {uploadedFiles.map(f => <option key={f.filename} value={f.filename}>{f.filename}</option>)}
            </select>
            <button onClick={() => {
              // refresh list
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

        </div>

        {!selectedFile ? (
          <textarea
            className="w-full bg-black/30 border border-white/10 p-3 rounded-xl mb-4"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        ) : (
          <div className="mb-4 text-sm text-white/70">Using uploaded file: <strong>{selectedFile}</strong> / <strong>{selectedColumn}</strong></div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-white/70">Steps:</label>
          <input
            type="number"
            min={1}
            value={steps}
            onChange={e => setSteps(Number(e.target.value))}
            className="w-24 px-2 py-1 rounded bg-white/10 border border-white/20 text-white"
          />

          <button
            onClick={handleRun}
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-2 text-black font-semibold"
          >
            {loading ? 'Running...' : 'Run Forecast'}
          </button>
        </div>

        {error && <div className="text-red-400 mb-4">{error}</div>}

        {forecast && (
          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <Line data={combinedChart()} options={{ responsive: true }} />
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h3 className="font-semibold mb-2">Forecast Summary</h3>
              <p className="text-sm text-white/70 mb-2">Next {steps} values:</p>
              <div className="grid grid-cols-2 gap-2">
                {forecast.preds.map((v, i) => (
                  <div key={i} className="bg-black/20 p-2 rounded">
                    <strong>F+{i + 1}:</strong> {Number(v).toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
