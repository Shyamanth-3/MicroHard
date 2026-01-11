import PageWrapper from "../components/PageWrapper";
import { motion } from "framer-motion";
import { useState } from "react";
import { uploadCSV } from "../services/api";
import { useDataset } from "../context/DataContext";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const { setDataset } = useDataset();

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
      const data = res.data || res;

      setPreview(data);

      // ✅ SET GLOBAL ACTIVE DATASET (KEY ADDITION)
      setDataset({
        fileName: data.filename || file.name,
        rows: data.rows ?? (data.sample ? data.sample.length : 0),
        type: data.file_type === "portfolio" ? "Portfolio Returns" : "Transactions",
        uploadedAt: new Date().toISOString(),
      });

      // Detect and save portfolio returns data (date + multiple return columns)
      try {
        const sample = data.sample || [];
        const columns = data.columns || [];

        const hasDate = columns.some(c => c.toLowerCase() === "date");
        const numericColumns = columns.filter(c => c.toLowerCase() !== "date");

        if (hasDate && numericColumns.length >= 2 && sample.length > 0) {
          const returns = numericColumns.map(asset => {
            const values = sample
              .map(row => parseFloat(row[asset]))
              .filter(v => !isNaN(v));
            return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          });

          localStorage.setItem(
            "portfolio_data",
            JSON.stringify({ assets: numericColumns, returns })
          );
        } else {
          const hasAsset = sample[0]?.asset;
          const hasReturn = sample[0]?.return;

          if (hasAsset && hasReturn) {
            localStorage.setItem(
              "portfolio_data",
              JSON.stringify({
                assets: sample.map(r => r.asset),
                returns: sample.map(r => r.return),
              })
            );
          } else {
            localStorage.removeItem("portfolio_data");
          }
        }
      } catch (err) {
        console.warn("Could not set portfolio_data from upload preview", err);
      }

      // Refresh uploads list
      try {
        const listRes = await fetch("http://127.0.0.1:8000/api/uploads");
        const json = await listRes.json();
        localStorage.setItem("uploaded_files", JSON.stringify(json.files || []));
      } catch (err) {
        console.warn("Could not refresh uploads list", err);
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
            💡 Portfolio returns: Upload CSV with 'date' column + asset return columns
          </span>
        </p>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-xl">
          <div className="flex flex-col items-center gap-6 border-2 border-dashed border-white/20 rounded-2xl py-20 text-center hover:border-cyan-400 transition">

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
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
