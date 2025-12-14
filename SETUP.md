# PenGPT Setup Guide

## Quick Start

### 1. Prerequisites

Install the following:
- Node.js 18+ and npm
- Redis (for job queue)
- Supabase account (free tier works)
- OpenAI API key

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`
4. Note down your:
   - Project URL
   - Anon Key
   - Service Role Key

### 3. Redis Setup

**Option A: Local Redis**
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

**Option B: Upstash Redis (Cloud)**
1. Sign up at https://upstash.com
2. Create a Redis database
3. Note down connection details

### 4. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
# - OPENAI_API_KEY
# - CORS_ORIGIN (http://localhost:3000)

# Start the API server
npm run dev

# In another terminal, start the worker
npm run dev:worker
```

### 5. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local with:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_API_URL (http://localhost:3001)

# Start the development server
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

## First Steps

1. **Sign Up**: Create an account on the frontend
2. **Create Organization**: The first user will need to create an organization
3. **Add Project**: Add a web application URL to scan
4. **Run Scan**: Start a penetration test scan
5. **View Results**: Review detected vulnerabilities and AI analysis

## Environment Variables Reference

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
OPENAI_API_KEY=sk-...
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Troubleshooting

### Backend won't start
- Check Redis is running: `redis-cli ping` (should return PONG)
- Verify all environment variables are set
- Check Supabase connection

### Frontend authentication issues
- Verify Supabase URL and keys are correct
- Check browser console for errors
- Ensure backend CORS_ORIGIN matches frontend URL

### Scans not running
- Ensure the worker is running: `npm run dev:worker`
- Check Redis connection
- Verify OpenAI API key is valid
- Check backend logs for errors

### Database errors
- Ensure migrations have been run
- Check RLS policies are enabled
- Verify user has proper permissions

## Production Deployment

### Backend
- Use environment variables from your hosting provider
- Set NODE_ENV=production
- Use a process manager like PM2
- Ensure Redis is accessible

### Frontend
- Build: `npm run build`
- Deploy to Vercel, Netlify, or similar
- Set production environment variables

### Database
- Use Supabase production instance
- Enable backups
- Monitor performance

## Next Steps

- Review the [PLAN.md](./PLAN.md) for feature roadmap
- Check [README.md](./README.md) for API documentation
- Customize scanners for your needs
- Add more vulnerability detection patterns






