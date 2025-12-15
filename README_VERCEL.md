# 🚀 Vercel Deployment - Quick Start

## ✅ Pre-Deployment Checklist

- [x] Project builds successfully (`npm run build` in frontend/)
- [x] All dependencies installed
- [x] Environment variables documented
- [x] Vercel configuration ready

## 📋 Step-by-Step Deployment

### 1. Deploy Backend First (Required!)

**Why?** The frontend needs a backend API URL to work.

**Quick Deploy on Railway:**
1. Visit https://railway.app
2. New Project → Deploy from GitHub
3. Select `pensecgpt` repo
4. Add Service → Set Root Directory to `backend`
5. Add environment variables (see `backend/.env` requirements)
6. Copy the Railway URL (e.g., `https://pensecgpt-production.up.railway.app`)

### 2. Deploy Frontend on Vercel

1. **Connect Repository**
   - Go to https://vercel.com
   - Add New Project
   - Import `pensecgpt` repository
   - Vercel auto-detects Next.js ✅

2. **Configure Settings**
   - Root Directory: `frontend` (verify this is set)
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```
   - Enable for: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployment URL

## 🔧 Configuration Files

- `vercel.json` - Vercel project configuration
- `.vercelignore` - Files to ignore during deployment
- `frontend/next.config.js` - Next.js configuration
- `VERCEL_SETUP.md` - Detailed setup guide

## 🐛 Common Issues

**Build fails:**
- Check Root Directory is set to `frontend`
- Verify all dependencies in `package.json`

**API calls fail:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is deployed and accessible
- Verify CORS allows your Vercel domain

**Blank page:**
- Check browser console for errors
- Verify environment variables are set
- Check Vercel function logs

## 📚 More Help

- See `VERCEL_SETUP.md` for detailed instructions
- See `QUICK_FIX.md` for troubleshooting
- See `DEPLOYMENT.md` for full deployment guide

## ✨ After Deployment

1. Test your Vercel URL
2. Verify API connectivity
3. Test authentication
4. Create a test project
5. Run a test scan

---

**Ready to deploy?** Follow the steps above and you'll be live in minutes! 🎉

