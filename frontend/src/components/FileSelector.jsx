import { useState, useEffect } from "react";
import FileManager from "../../utils/fileManager";

/**
 * FileSelector Component
 * Reusable component for selecting uploaded files and columns
 */
export default function FileSelector({
  selectedFile,
  onFileChange,
  selectedColumn,
  onColumnChange,
  showColumnsInfo = true,
}) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [csvRows, setCsvRows] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load files on mount
  useEffect(() => {
    loadFiles();
    const unsubscribe = FileManager.onFilesChanged(loadFiles);
    return unsubscribe;
  }, []);

  // Load columns when file changes
  useEffect(() => {
    if (selectedFile) {
      loadColumns();
    }
  }, [selectedFile]);

  const loadFiles = async () => {
    setLoading(true);
    const files = await FileManager.getAllFiles();
    setUploadedFiles(files);
    if (!selectedFile && files.length > 0) {
      onFileChange(files[0].filename);
    }
    setLoading(false);
  };

  const loadColumns = async () => {
    if (!selectedFile) return;
    const { columns, rows } = await FileManager.getFileColumns(selectedFile);
    setCsvColumns(columns);
    setCsvRows(rows);

    // Auto-select first numeric column
    if (columns.length > 0 && !selectedColumn) {
      onColumnChange(columns[0]);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="space-y-4">
        {/* File Selection */}
        <div>
          <label className="text-sm text-white/70 block mb-2 font-semibold">
            📁 Select File
          </label>
          <div className="flex items-center gap-3">
            <select
              value={selectedFile || ""}
              onChange={(e) => onFileChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
              disabled={uploadedFiles.length === 0}
            >
              <option value="">-- select a file --</option>
              {uploadedFiles.map((f) => (
                <option key={f.filename} value={f.filename}>
                  {f.filename}
                </option>
              ))}
            </select>
            <button
              onClick={loadFiles}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded hover:bg-white/20 transition text-sm"
              disabled={loading}
            >
              {loading ? "..." : "🔄"}
            </button>
          </div>

          {uploadedFiles.length === 0 && (
            <p className="text-xs text-white/50 mt-2">
              No files uploaded. Go to Upload page first.
            </p>
          )}
        </div>

        {/* File Info */}
        {selectedFile && csvRows > 0 && showColumnsInfo && (
          <div className="p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg">
            <p className="text-xs text-cyan-300 font-semibold">
              ✓ {selectedFile}
            </p>
            <p className="text-xs text-white/60">
              {csvRows} rows • {csvColumns.length} columns
            </p>
          </div>
        )}

        {/* Column Selection */}
        {csvColumns.length > 0 && (
          <div>
            <label className="text-sm text-white/70 block mb-2 font-semibold">
              📊 Select Column
            </label>
            <select
              value={selectedColumn || ""}
              onChange={(e) => onColumnChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
            >
              {csvColumns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
