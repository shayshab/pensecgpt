# Configuration Guide

## Backend Environment Variables

Create a file `backend/.env` with the following content:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://lhlgsghdhafoiskodeqc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobGdzZ2hkaGFmb2lza29kZXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTI2NzksImV4cCI6MjA4MDM2ODY3OX0.SEbvNiv3d4-xYbyYIq-aBHCtXWMNVN44dUBMZEcdK50
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# OpenAI Configuration
OPENAI_API_KEY=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

# JWT Secret (if needed)
JWT_SECRET=your_jwt_secret_change_in_production

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Important**: You need to get your Supabase Service Role Key:
1. Go to https://supabase.com/dashboard/project/lhlgsghdhafoiskodeqc
2. Navigate to Settings > API
3. Copy the "service_role" key (keep this secret!)
4. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in the .env file

## Frontend Environment Variables

Create a file `frontend/.env.local` with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lhlgsghdhafoiskodeqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobGdzZ2hkaGFmb2lza29kZXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTI2NzksImV4cCI6MjA4MDM2ODY3OX0.SEbvNiv3d4-xYbyYIq-aBHCtXWMNVN44dUBMZEcdK50
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Quick Setup Commands

Run these commands to create the files:

```bash
# Backend .env
cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://lhlgsghdhafoiskodeqc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobGdzZ2hkaGFmb2lza29kZXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTI2NzksImV4cCI6MjA4MDM2ODY3OX0.SEbvNiv3d4-xYbyYIq-aBHCtXWMNVN44dUBMZEcdK50
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
OPENAI_API_KEY=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
JWT_SECRET=your_jwt_secret_change_in_production
CORS_ORIGIN=http://localhost:3000
EOF

# Frontend .env.local
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://lhlgsghdhafoiskodeqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobGdzZ2hkaGFmb2lza29kZXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTI2NzksImV4cCI6MjA4MDM2ODY3OX0.SEbvNiv3d4-xYbyYIq-aBHCtXWMNVN44dUBMZEcdK50
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
```

## Next Steps

1. **Get Service Role Key**: 
   - Visit: https://supabase.com/dashboard/project/lhlgsghdhafoiskodeqc/settings/api
   - Copy the "service_role" key
   - Update `backend/.env` with the service role key

2. **Run Database Migration**:
   - Go to Supabase SQL Editor
   - Run the migration: `supabase/migrations/001_initial_schema.sql`

3. **Install Dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Start Redis** (if not already running):
   ```bash
   # macOS
   brew services start redis
   
   # Or run directly
   redis-server
   ```

5. **Start the Application**:
   ```bash
   # Terminal 1: Backend API
   cd backend
   npm run dev
   
   # Terminal 2: Worker
   cd backend
   npm run dev:worker
   
   # Terminal 3: Frontend
   cd frontend
   npm run dev
   ```

6. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health






