# MicroHard FinSight

Full-stack finance MVP for forecasting, Monte Carlo simulations, portfolio optimization, uploads, and AI insights (Gemini). Includes FastAPI backend + React/Vite frontend.

## Features
- File uploads (multiple CSVs) with column inspection and shared access across pages
- Forecasting: linear regression forecast with combined historical/forecast chart
- Monte Carlo simulation: percentile bands, parameter tuning, CSV-derived stats
- Portfolio optimization: constrained weights, saved portfolios
- AI insights: Google Gemini analysis for simulation, forecast, and optimization outputs
- Dashboard/Home previews with charts and sample visuals

## Tech Stack (Quick List)
- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Chart.js, React Router, Axios
- **Backend:** FastAPI, SQLModel, Pydantic, Uvicorn, NumPy, SciPy, scikit-learn, pandas
- **Database:** SQLite (default, file-based) with optional PostgreSQL via `DATABASE_URL`
- **AI:** Google Gemini (via `VITE_GEMINI_API_KEY`)
- **Build/Tooling:** npm, Vite dev server, Chart.js adapters, CSV upload (FormData), ESLint config

## Project Structure
- `Backend/` FastAPI app, models, services, pipelines   
- `frontend/` React SPA (Vite), pages, components, services
- `data/raw/` Sample CSVs (portfolio, historical prices, transactions)

## Setup
1) Backend
```
cd Backend
pip install -r requirments.txt
uvicorn src.app.main:app --reload
```
- Env: `DATABASE_URL` (optional; defaults to SQLite file `portfolio.db`)

2) Frontend
```
cd frontend
npm install
npm run dev
```
- Env: create `.env.local` with `VITE_GEMINI_API_KEY=your_key` and optional `VITE_API_BASE_URL` (default http://127.0.0.1:8000)

## Key Endpoints (prefix `/api`)
- `POST /forecast` – linear regression forecast
- `POST /monte-carlo` – Monte Carlo simulation
- `POST /optimize` – portfolio weights
- `POST /upload` | `GET /uploads` | `GET /uploads/{file}/columns` | `GET /uploads/{file}/column`
- `POST /save-portfolio` | `GET /portfolios`
- `GET /health`

## Notes
- AI analysis requires valid Gemini key
- SQLite is production-simple for demo; switch to Neon/Supabase/Railway Postgres by setting `DATABASE_URL`
- Charts and pages expect uploaded CSVs or stored local data
