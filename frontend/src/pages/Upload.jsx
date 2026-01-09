import PageWrapper from "../components/PageWrapper";
import { motion } from "framer-motion";
import { useState } from "react";
import { uploadCSV } from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await uploadCSV(formData);

      setPreview(res.data || res);

      // Detect and save portfolio returns data (date + multiple return columns)
      try {
        const sample = (res.data.sample || []);
        const columns = res.data.columns || [];
        
        // Check if this is a portfolio returns file (has date + multiple numeric columns)
        const hasDate = columns.some(c => c.toLowerCase() === 'date');
        const numericColumns = columns.filter(c => c.toLowerCase() !== 'date');
        
        if (hasDate && numericColumns.length >= 2 && sample.length > 0) {
          // This looks like a portfolio returns file
          console.log('✓ Detected portfolio returns file with assets:', numericColumns);
          
          // Calculate average returns for each asset
          const returns = numericColumns.map(asset => {
            const values = sample
              .map(row => parseFloat(row[asset]))
              .filter(v => !isNaN(v));
            
            if (values.length === 0) return 0;
            return values.reduce((sum, v) => sum + v, 0) / values.length;
          });
          
          localStorage.setItem("portfolio_data", JSON.stringify({
            assets: numericColumns,
            returns: returns
          }));
          
          console.log('✓ Saved portfolio data:', { assets: numericColumns, returns });
        } else {
          // Check for simple asset/return format
          const hasAsset = sample.length > 0 && Object.prototype.hasOwnProperty.call(sample[0], 'asset');
          const hasReturn = sample.length > 0 && Object.prototype.hasOwnProperty.call(sample[0], 'return');
          
          if (hasAsset && hasReturn) {
            localStorage.setItem("portfolio_data", JSON.stringify({
              assets: sample.map(r => r.asset),
              returns: sample.map(r => r.return)
            }));
          } else {
            // Transaction file - clear stale portfolio data
            localStorage.removeItem('portfolio_data');
          }
        }
      } catch (err) {
        console.warn('Could not set portfolio_data from upload preview', err);
      }

      // Refresh uploads list in localStorage for other pages to pick up
      // Refresh uploads list in localStorage for other pages to pick up
    // Refresh uploads list in localStorage for other pages to pick up
    try {
      const listRes = await fetch("http://127.0.0.1:8000/api/uploads");
      const json = await listRes.json();
      localStorage.setItem('uploaded_files', JSON.stringify(json.files || []));
    } catch (err) {
      console.warn('Could not refresh uploads list', err);
    }



    } catch (err) {
      alert("Upload failed — check backend logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-4xl px-8 pt-20"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Upload your financial data
        </h1>

        <p className="text-white/70 mb-10 max-w-2xl">
          Upload your bank statements, transaction files, or portfolio returns CSV to begin analyzing,
          forecasting, and optimizing your finances.
          <br />
          <span className="text-xs text-cyan-400 mt-2 block">
            💡 Portfolio returns: Upload CSV with 'date' column + asset return columns (e.g., US_Stocks, Bonds, etc.)
          </span>
        </p>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-xl">
          <div className="flex flex-col items-center gap-6 border-2 border-dashed border-white/20 rounded-2xl py-20 text-center hover:border-cyan-400 transition">

            {/* File Picker */}
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="fileInput"
              onChange={handleFileChange}
            />

            <label
              htmlFor="fileInput"
              className="cursor-pointer rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-black hover:scale-105 transition"
            >
              Browse Files
            </label>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-full border border-white/30 px-6 py-3 hover:bg-white/10 transition disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>

            {preview && preview.sample && (
              <div className="mt-6 w-full text-left text-white/80">
                <h3 className="font-semibold mb-2">Preview</h3>

                <p>File: {preview.filename}</p>
                <p>Rows detected: {preview.rows}</p>
                
                {preview.file_type && (
                  <p className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      preview.file_type === 'portfolio' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {preview.file_type === 'portfolio' ? '📊 Portfolio Returns' : '💰 Transaction Data'}
                    </span>
                  </p>
                )}
                
                {preview.file_type === 'transactions' && (
                  <p>Imported to database: {preview.imported}</p>
                )}
                
                {preview.file_type === 'portfolio' && (
                  <p className="text-cyan-400 text-sm mt-2">
                    ✓ Portfolio data ready for optimization
                  </p>
                )}

                {preview.detected_fields && preview.file_type === 'transactions' && (
                  <div className="mt-4 p-4 bg-black/30 rounded-xl">
                    <h4 className="text-sm font-semibold mb-2 text-emerald-400">✓ Auto-detected fields:</h4>
                    <ul className="text-xs space-y-1">
                      {Object.entries(preview.detected_fields).map(([field, column]) => (
                        <li key={field}>
                          <span className="text-cyan-400">{field}</span>: <span className="text-white/60">{column}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <pre className="mt-4 bg-black/40 p-4 rounded-xl text-xs overflow-x-auto">
                  {JSON.stringify(preview.sample, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
