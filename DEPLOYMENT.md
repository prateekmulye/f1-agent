# F1 Agent Deployment Guide

This guide covers deployment of the F1 Agent application with the new Python FastAPI backend.

## Architecture Overview

- **Frontend**: Next.js 15 React application (deployed on Vercel)
- **Backend**: Python FastAPI application (deployed separately)
- **Database**: Neon PostgreSQL (serverless)

## Local Development

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- Access to Neon PostgreSQL database

### Setup

1. **Frontend Setup**
   ```bash
   cd apps/web
   pnpm install
   ```

2. **Backend Setup**
   ```bash
   cd apps/python-api/apps/python-api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Variables**

   For frontend (`apps/web/.env.local`):
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
   GROQ_API_KEY=your_groq_api_key
   NEON_DATABASE_URL=your_neon_database_url
   ```

   For backend:
   ```bash
   export DATABASE_URL="your_neon_database_url"
   export SECRET_KEY="your_secret_key"
   ```

### Running Locally

1. **Start Python Backend**
   ```bash
   cd apps/python-api/apps/python-api
   source venv/bin/activate
   python simple_main.py
   ```
   Backend will be available at: http://localhost:8001

2. **Start Frontend**
   ```bash
   cd apps/web
   pnpm dev
   ```
   Frontend will be available at: http://localhost:3001

## Production Deployment

### Frontend Deployment (Vercel)

The frontend is configured for Vercel deployment:

1. **Environment Variables on Vercel**:
   - `NEXT_PUBLIC_API_BASE_URL`: URL of your deployed Python backend
   - `GROQ_API_KEY`: Your Groq API key
   - `NEON_DATABASE_URL`: Your Neon database connection string

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

### Backend Deployment Options

#### Option 1: Railway
1. Create a new Railway project
2. Connect your GitHub repository
3. Set environment variables:
   - `DATABASE_URL`
   - `SECRET_KEY`
4. Deploy from `apps/python-api/apps/python-api/`

#### Option 2: Render
1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python simple_main.py`
5. Add environment variables

#### Option 3: Docker Deployment
Use the provided `Dockerfile.prod`:

```bash
cd apps/python-api/apps/python-api
docker build -f Dockerfile.prod -t f1-api .
docker run -p 8001:8000 -e DATABASE_URL="..." -e SECRET_KEY="..." f1-api
```

## Environment Variables Reference

### Frontend (Next.js)
- `NEXT_PUBLIC_API_BASE_URL`: Python backend URL (e.g., https://your-api.railway.app)
- `GROQ_API_KEY`: Groq API key for AI functionality
- `NEON_DATABASE_URL`: Database connection (used for some legacy features)

### Backend (Python)
- `DATABASE_URL`: Neon PostgreSQL connection string
- `SECRET_KEY`: JWT secret key for authentication
- `REDIS_URL`: Optional Redis URL for rate limiting (defaults to in-memory)

## API Endpoints

The Python backend provides these endpoints:

- `GET /api/v1/health` - Health check
- `GET /api/v1/drivers` - List all drivers
- `GET /api/v1/drivers/{id}` - Get specific driver
- `GET /api/v1/teams` - List all teams
- `GET /api/v1/teams/{id}` - Get specific team
- `GET /api/v1/races` - List all races
- `GET /api/v1/races/upcoming` - Upcoming races
- `GET /api/v1/races/recent` - Recent races
- `GET /api/v1/predictions/race/{race_id}` - Race predictions
- `POST /api/v1/predictions/race/{race_id}` - Generate predictions
- `GET /api/v1/standings` - Championship standings
- `POST /api/v1/chat/message` - Chat with AI agent

## Migration Notes

The application has been migrated from Node.js/TypeScript backend to Python FastAPI:

- All API routes are now served by the Python backend
- Frontend components use the new API utility (`/src/lib/api.ts`)
- Mock data is provided for immediate functionality
- Database integration can be added incrementally

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `NEXT_PUBLIC_API_BASE_URL` is set correctly
2. **Connection Refused**: Check if Python backend is running on correct port
3. **Build Failures**: Verify all environment variables are set in deployment platform

### Logs and Monitoring

- Frontend: Check Vercel deployment logs
- Backend: Check application logs in your deployment platform
- Database: Monitor via Neon dashboard

## Performance Considerations

- Python backend uses in-memory mock data for fast responses
- Frontend is optimized with Next.js 15 and Turbopack
- Database queries are cached where appropriate
- API responses are structured for minimal data transfer