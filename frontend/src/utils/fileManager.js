/**
 * File Manager Utility
 * Manages uploaded files across all pages
 */

const API_BASE = "http://127.0.0.1:8000";

export const FileManager = {
  /**
   * Get all uploaded files from backend
   */
  async getAllFiles() {
    try {
      const resp = await fetch(`${API_BASE}/api/uploads`);
      const json = await resp.json();
      return json.files || [];
    } catch (err) {
      console.error("Failed to fetch files:", err);
      return [];
    }
  },

  /**
   * Get columns from a specific file
   */
  async getFileColumns(filename) {
    try {
      const resp = await fetch(`${API_BASE}/api/uploads/${filename}/columns`);
      const json = await resp.json();
      return {
        columns: json.columns || [],
        rows: json.rows || 0,
      };
    } catch (err) {
      console.error("Failed to fetch columns:", err);
      return { columns: [], rows: 0 };
    }
  },

  /**
   * Get values from a specific column
   */
  async getColumnValues(filename, columnName) {
    try {
      const resp = await fetch(
        `${API_BASE}/api/uploads/${filename}/column?name=${encodeURIComponent(columnName)}`
      );
      const json = await resp.json();
      return json.values || [];
    } catch (err) {
      console.error("Failed to fetch column values:", err);
      return [];
    }
  },

  /**
   * Save to localStorage for cross-page access
   */
  saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  },

  /**
   * Get from localStorage
   */
  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (err) {
      console.error("Failed to get from localStorage:", err);
      return null;
    }
  },

  /**
   * Listen for file updates across tabs/windows
   */
  onFilesChanged(callback) {
    const handleStorageChange = (event) => {
      if (event.key === "uploaded_files" || event.key === null) {
        callback();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  },
};

export default FileManager;
