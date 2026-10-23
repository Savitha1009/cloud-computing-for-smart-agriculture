# ☁️ Cloud Deployment Guide

## 1. GitHub — Version Control

```powershell
cd "proj 4"
git init
git add .
git commit -m "Initial commit: Smart Agriculture Platform"
# Create repo on GitHub, then:
git remote add origin https://github.com/<your-username>/smart-agriculture.git
git push -u origin main
```

---

## 2. MongoDB Atlas — Database

1. Sign up at https://cloud.mongodb.com (free tier is sufficient)
2. Create a **new project** → **Build a Database** → choose **M0 Free**
3. Choose AWS / region closest to you
4. Set username + password → note them down
5. Under **Network Access** → Add IP: `0.0.0.0/0` (allows Render backend)
6. Under **Database** → **Connect** → choose **Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<user>` and `<pass>` with your actual credentials
8. Set as `MONGODB_URL` environment variable in both local `.env` and Render

---

## 3. Backend — Render

1. Sign up at https://render.com
2. **New** → **Web Service** → connect your GitHub repo
3. Set **Root Directory** to `backend`
4. **Build command**: `pip install -r requirements.txt`
5. **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables** (add in Render dashboard):
   ```
   MONGODB_URL      = <your Atlas URL>
   SECRET_KEY       = <generate a 64-char random string>
   CORS_ORIGINS     = https://<your-vercel-app>.vercel.app
   ENVIRONMENT      = production
   MONGODB_DB_NAME  = smart_agriculture
   ```
7. Deploy → copy the Render service URL (e.g., `https://smart-agri-api.onrender.com`)

---

## 4. Frontend — Vercel

1. Sign up at https://vercel.com
2. **Add New Project** → import your GitHub repo
3. Set **Root Directory** to `frontend`
4. **Build command**: `npm run build`
5. **Output directory**: `dist`
6. **Environment Variables**:
   ```
   VITE_API_URL = https://smart-agri-api.onrender.com
   ```
7. Deploy → copy your Vercel URL

---

## 5. Post-Deployment Checklist

- [ ] Open `https://<your-app>.vercel.app` in browser
- [ ] Register a new account
- [ ] Create a field with real coordinates
- [ ] Check weather loads from Open-Meteo
- [ ] Open `https://smart-agri-api.onrender.com/docs` for Swagger UI
- [ ] Run sensor simulator: set `BACKEND_URL` and `JWT_TOKEN`

---

## 6. Troubleshooting

| Problem | Solution |
|---|---|
| 401 on all requests | Check CORS_ORIGINS includes your Vercel URL |
| MongoDB timeout | Check Atlas IP whitelist has `0.0.0.0/0` |
| Weather API fails | Verify field has valid lat/lon |
| Frontend blank | Check VITE_API_URL is set correctly |
| Render cold starts | Free tier sleeps after 15min inactivity |
