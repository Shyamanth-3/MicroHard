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

      // Save a small preview-based portfolio_data only if the sample has expected fields
      try {
        const sample = (res.data.sample || []);
        const hasAsset = sample.length > 0 && Object.prototype.hasOwnProperty.call(sample[0], 'asset');
        const hasReturn = sample.length > 0 && Object.prototype.hasOwnProperty.call(sample[0], 'return');
        if (hasAsset && hasReturn) {
          localStorage.setItem("portfolio_data", JSON.stringify({
            assets: sample.map(r => r.asset),
            returns: sample.map(r => r.return)
          }));
        } else {
          // clear any stale portfolio_data to avoid mismatches
          localStorage.removeItem('portfolio_data');
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

        <p className="text-white/70 mb-10 max-w-xl">
          Upload your bank statements or transaction files to begin analyzing,
          forecasting, and optimizing your finances.
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

                <pre className="mt-4 bg-black/40 p-4 rounded-xl text-xs">
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
