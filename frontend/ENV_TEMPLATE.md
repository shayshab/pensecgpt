# Environment Variables Template

Copy these variables to your Vercel project settings:

## Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://lhlgsghdhafoiskodeqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobGdzZ2hkaGFmb2lza29kZXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTI2NzksImV4cCI6MjA4MDM2ODY3OX0.SEbvNiv3d4-xYbyYIq-aBHCtXWMNVN44dUBMZEcdK50
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

## How to Add in Vercel

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add each variable:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Your actual value
   - **Environment**: Select Production, Preview, and Development
4. Click "Save"
5. Redeploy your project

## Notes

- `NEXT_PUBLIC_API_URL` should point to your deployed backend (Railway, Render, etc.)
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Never commit actual `.env` files with real values to Git

