# Deployment Guide

## Frontend (Vercel)

The frontend is deployed on Vercel. Follow these steps:

### 1. Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

**Important**: Replace `NEXT_PUBLIC_API_URL` with your actual backend deployment URL (see Backend deployment below).

### 2. Build Settings

Vercel should auto-detect Next.js, but if not, configure:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 3. Redeploy

After setting environment variables, trigger a new deployment.

## Backend Deployment Options

The backend needs to be deployed separately. Choose one:

### Option 1: Railway (Recommended)

1. Go to https://railway.app
2. Create a new project
3. Connect your GitHub repository
4. Add a new service → Select `backend` folder
5. Add environment variables:
   ```
   PORT=3001
   NODE_ENV=production
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   REDIS_HOST=your_redis_host
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   OPENAI_API_KEY=your_openai_api_key
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
6. Railway will auto-deploy and give you a URL like: `https://your-app.railway.app`
7. Update `NEXT_PUBLIC_API_URL` in Vercel with this URL

### Option 2: Render

1. Go to https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Render will give you a URL like: `https://your-app.onrender.com`
7. Update `NEXT_PUBLIC_API_URL` in Vercel

### Option 3: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. In the `backend` folder, run: `fly launch`
3. Add environment variables using: `fly secrets set KEY=value`
4. Deploy: `fly deploy`
5. Get URL and update Vercel

## Redis Deployment

For production, use a managed Redis service:

### Upstash Redis (Recommended)

1. Go to https://upstash.com
2. Create a Redis database
3. Copy connection details
4. Update `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in your backend deployment

### Redis Cloud

1. Go to https://redis.com/cloud
2. Create a free database
3. Use connection details in backend

## Worker Process

The scan worker needs to run separately. Options:

1. **Separate Railway/Render service**: Deploy `backend` again but with start command: `npm run dev:worker`
2. **Same server with PM2**: Use PM2 to run both API and worker
3. **Docker**: Create a Dockerfile that runs both processes

## Quick Fix for Current Vercel Deployment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` pointing to your backend (deploy backend first!)
3. Redeploy the frontend

## Troubleshooting

### Frontend shows "Failed to fetch"
- Check that `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Ensure backend CORS allows your Vercel domain
- Check backend is running and accessible

### Backend not starting
- Check all environment variables are set
- Verify Redis connection
- Check logs in your hosting platform

### Scans not working
- Ensure worker process is running
- Check Redis connection
- Verify OpenAI API key is set

