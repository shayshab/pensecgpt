# Vercel Deployment Setup Guide

## Quick Setup Steps

### 1. Connect Repository to Vercel

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your `pensecgpt` repository
5. Vercel will auto-detect Next.js

### 2. Configure Project Settings

**Root Directory**: `frontend`
- Vercel should auto-detect this, but verify in Settings → General

**Build Settings** (should auto-detect):
- Framework Preset: Next.js
- Build Command: `npm run build` (runs in frontend directory)
- Output Directory: `.next`
- Install Command: `npm install`

### 3. Add Environment Variables

Go to **Settings → Environment Variables** and add:

#### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL
```
Your Supabase project URL
- Example: `https://lhlgsghdhafoiskodeqc.supabase.co`

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Your Supabase anonymous/public key
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

```
NEXT_PUBLIC_API_URL
```
Your backend API URL (deploy backend first!)
- For local: `http://localhost:3001`
- For production: `https://your-backend.railway.app` or `https://your-backend.onrender.com`

#### Environment Variable Settings:

- ✅ Select **Production**
- ✅ Select **Preview** 
- ✅ Select **Development** (optional, for preview deployments)

### 4. Deploy

1. Click **Deploy** button
2. Wait for build to complete
3. Check build logs for any errors
4. Visit your deployment URL

## Backend Deployment (Required)

**IMPORTANT**: The frontend needs a backend API to work. Deploy the backend first:

### Option 1: Railway (Recommended)

1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub repo
4. Select `pensecgpt` repository
5. Add Service → GitHub Repo → Select repo again
6. In service settings:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
7. Add environment variables (see backend `.env` requirements)
8. Copy the generated URL (e.g., `https://pensecgpt-production.up.railway.app`)
9. Use this URL as `NEXT_PUBLIC_API_URL` in Vercel

### Option 2: Render

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables
6. Copy URL and use in Vercel

## Environment Variables Checklist

Before deploying, ensure you have:

- [ ] Supabase URL
- [ ] Supabase Anon Key
- [ ] Backend API URL (deploy backend first!)
- [ ] All variables added to Vercel
- [ ] Variables enabled for Production, Preview, and Development

## Testing the Deployment

1. Visit your Vercel URL
2. Open browser DevTools → Console
3. Check for any errors
4. Open Network tab
5. Try to load the dashboard
6. Verify API calls go to your backend URL (not localhost)

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check that `rootDirectory` is set to `frontend`
- Verify all dependencies are in `frontend/package.json`

**Error: "Environment variable not found"**
- Make sure all `NEXT_PUBLIC_*` variables are set in Vercel
- Redeploy after adding variables

### Runtime Errors

**"Failed to fetch" or CORS errors**
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend CORS allows your Vercel domain
- Check backend is running and accessible

**Blank page or 404**
- Check browser console for errors
- Verify all routes are properly configured
- Check Next.js build logs

### API Not Working

**All API calls fail**
- Verify `NEXT_PUBLIC_API_URL` points to your deployed backend
- Check backend logs to see if requests are received
- Verify backend CORS configuration includes your Vercel domain

## Post-Deployment

After successful deployment:

1. ✅ Test all major features
2. ✅ Verify API connectivity
3. ✅ Check authentication flow
4. ✅ Test scan creation and execution
5. ✅ Monitor Vercel logs for errors

## Custom Domain (Optional)

1. Go to Vercel Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `CORS_ORIGIN` in backend to include new domain

## Monitoring

- Check Vercel Analytics for performance
- Monitor Function logs for API issues
- Set up error tracking (Sentry, etc.) if needed

