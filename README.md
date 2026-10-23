# 🌾 Cloud Computing for Smart Agriculture

A full-stack smart agriculture monitoring platform built with React + Vite (frontend), FastAPI (backend), MongoDB Atlas (database), and Open-Meteo weather API.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
│              React + Vite (Vercel)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS REST API
┌─────────────────────▼───────────────────────────────────────┐
│                  BACKEND API SERVER                         │
│              FastAPI + Python (Render)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │    Auth     │  │  Sensor API  │  │  Weather API     │   │
│  │  JWT/bcrypt │  │  CRUD + sim  │  │  Open-Meteo      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Irrigation Recommendation Engine             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ PyMongo
┌─────────────────────▼───────────────────────────────────────┐
│               MongoDB Atlas (Cloud)                         │
│  users | fields | crops | sensor_readings                   │
│  weather_records | irrigation_recommendations | alerts      │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.11+, MongoDB Atlas account, Git

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit http://localhost:5173 for the app and http://localhost:8000/docs for API docs.
