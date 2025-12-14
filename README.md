# PenGPT - Automated Penetration Testing SaaS Platform

A comprehensive SaaS platform that automatically performs penetration testing on web applications, detecting major vulnerabilities (OWASP Top 10, misconfigurations, logic issues) using automated scanning, attack simulation, and AI-powered analysis.

## Features

- 🔒 **OWASP Top 10 Scanning**: Automated detection of the most critical web vulnerabilities
- 🤖 **AI-Powered Analysis**: GPT-4 powered vulnerability analysis and recommendations
- 📊 **Comprehensive Reporting**: Generate detailed reports in JSON, HTML, and PDF formats
- 🚀 **Scalable Architecture**: Built with modern technologies for scalability
- 🔐 **Multi-tenant Support**: Organization-based access control
- ⚡ **Real-time Scanning**: Queue-based scanning system with BullMQ

## Tech Stack

### Backend
- **Framework**: Node.js with Express.js (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Queue System**: BullMQ (Redis)
- **AI/ML**: OpenAI API
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS
- **State Management**: TanStack Query
- **Authentication**: Supabase Auth

## Project Structure

```
pengpt/
├── backend/          # Express.js API server
├── frontend/         # Next.js web application
├── supabase/         # Database migrations
├── shared/           # Shared types
└── docs/             # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- Redis (for BullMQ)
- Supabase account
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGIN=http://localhost:3000
```

5. Run database migrations in Supabase:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`

6. Start the backend:
```bash
npm run dev
```

7. Start the scan worker (in a separate terminal):
```bash
npm run dev:worker
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

## OWASP Top 10 Scanners

The platform includes scanners for:

1. **A01:2021 – Broken Access Control** (IDOR, Authorization)
2. **A02:2021 – Cryptographic Failures** (Sensitive Data Exposure)
3. **A03:2021 – Injection** (SQL Injection, XSS)
4. **A04:2021 – Insecure Design** (Design Flaws)
5. **A05:2021 – Security Misconfiguration** (Security Headers)
6. **A07:2021 – Authentication Failures** (Weak Authentication)
7. **A09:2021 – Security Logging Failures** (Information Disclosure)

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Scans
- `GET /api/scans` - List all scans
- `POST /api/scans` - Create a scan
- `GET /api/scans/:id` - Get scan details
- `POST /api/scans/:id/cancel` - Cancel a running scan
- `GET /api/scans/:id/status` - Get scan status

### Vulnerabilities
- `GET /api/vulnerabilities` - List vulnerabilities
- `GET /api/vulnerabilities/:id` - Get vulnerability details
- `PUT /api/vulnerabilities/:id` - Update vulnerability
- `GET /api/vulnerabilities/project/:projectId` - Get project vulnerabilities

### Reports
- `GET /api/reports/scan/:scanId` - Get scan reports
- `POST /api/reports/scan/:scanId/generate` - Generate report

## Security Considerations

- Rate limiting on all API endpoints
- Input validation and sanitization
- Secure API key management
- CORS configuration
- SQL injection prevention (parameterized queries)
- XSS prevention
- CSRF protection
- Row Level Security (RLS) in Supabase

## Development

### Running Tests
```bash
cd backend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.






# pensecgpt
