import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const uploadCSV = (data) => api.post("/api/upload", data);
export const listUploads = () => api.get('/api/uploads');
export const getUploadColumns = (filename) => api.get(`/api/uploads/${filename}/columns`);
export const getUploadColumnValues = (filename, name) => api.get(`/api/uploads/${filename}/column`, { params: { name } });
export const forecast = (data) => api.post("/api/forecast", data);
export const monteCarlo = (data) => api.post("/api/monte-carlo", data);
export const optimize = (data) => api.post("/api/optimize", data);
export const savePortfolio = (data) => api.post("/api/save-portfolio", data);
export const runSimulation = (data) =>
  api.post("/api/monte-carlo", data);
export const runForecast = (data) =>
  api.post("/api/forecast", data);

export default api;
