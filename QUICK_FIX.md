# Quick Fix for Vercel Deployment

## The Problem
Your frontend is deployed on Vercel but it's trying to connect to `localhost:3001` which doesn't exist in production.

## Immediate Steps

### Step 1: Deploy Backend First

You need to deploy the backend to get a production URL. Choose one:

**Option A: Railway (Easiest - 5 minutes)**
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `pensecgpt` repository
5. Click "Add Service" → "GitHub Repo"
6. Select your repo again
7. In settings, set **Root Directory** to: `backend`
8. Add these environment variables:
   ```
   PORT=3001
   NODE_ENV=production
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   REDIS_HOST=your_redis_host (or use Upstash)
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   OPENAI_API_KEY=your_openai_api_key
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
9. Railway will auto-deploy and give you a URL like: `https://pensecgpt-production.up.railway.app`
10. Copy this URL

**Option B: Render (Free tier available)**
1. Go to https://render.com
2. Sign up/login
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name**: pensecgpt-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add environment variables (same as Railway)
7. Click "Create Web Service"
8. Copy the URL (e.g., `https://pensecgpt-backend.onrender.com`)

### Step 2: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Click on your `pensecgpt` project
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=https://your-backend-url.com (from Step 1)
   ```
5. Make sure to select **Production**, **Preview**, and **Development** for all variables
6. Click "Save"

### Step 3: Redeploy Frontend

1. In Vercel, go to **Deployments**
2. Click the "..." menu on the latest deployment
3. Click "Redeploy"
4. Or push a new commit to trigger auto-deploy

### Step 4: Test

1. Visit your Vercel URL
2. Open browser DevTools → Network tab
3. Try to create a project or load the dashboard
4. Check if API calls are going to your backend URL (not localhost)

## If You Don't Have Redis Yet

For quick testing, you can use **Upstash Redis** (free tier):
1. Go to https://upstash.com
2. Sign up (free)
3. Create a Redis database
4. Copy the connection details
5. Use them in your backend environment variables

## Common Issues

**"Failed to fetch" errors:**
- Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Make sure backend CORS allows your Vercel domain
- Check backend logs to see if it's receiving requests

**Backend not starting:**
- Check all environment variables are set
- Verify Redis connection works
- Check backend deployment logs

**CORS errors:**
- Update `CORS_ORIGIN` in backend to include your Vercel URL
- Format: `https://your-app.vercel.app` (no trailing slash)

