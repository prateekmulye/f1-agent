# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
# Start development server
pnpm --filter web dev

# Build the web application
pnpm --filter web build

# Build with memory optimization (matches Vercel config)
NODE_OPTIONS='--max-old-space-size=4096' pnpm --filter web build

# Run linting
pnpm --filter web lint
```

### Data and Model Operations
```bash
# Run evaluations (requires NEON_DATABASE_URL)
tsx scripts/run_eval.ts

# Load model coefficients to database
tsx scripts/load_model_coeffs.ts

# Seed current features data
tsx scripts/seed_features_current.ts

# Seed Neon database with initial schema
tsx scripts/seed_neon.ts

# Build training dataset (Python)
python scripts/build_dataset.py

# Train baseline model (Python)
python scripts/train_baseline.py
```

## Architecture

### Workspace Structure
- **Monorepo**: Uses pnpm workspaces with `apps/` and `packages/` directories
- **Main app**: `apps/web/` - Next.js 15 application with App Router
- **MCP server**: `packages/mcp-server/` - Model Context Protocol integration
- **Scripts**: Root-level `scripts/` directory contains data processing and ML utilities

### Core Application (apps/web/)
- **Framework**: Next.js 15 with React 19, TypeScript, and Tailwind CSS v4
- **Database**: Neon serverless PostgreSQL via `@neondatabase/serverless`
- **AI Integration**: LangChain with Groq (Llama 3.1) for agent functionality
- **Styling**: Tailwind CSS v4 with PostCSS configuration

### Key API Endpoints
- `/api/agent` - AI agent using Groq/Llama with prediction and evaluation tools
- `/api/predict` - Core prediction engine for F1 race outcomes
- `/api/evals/run` - Model evaluation endpoint (shells out to `run_eval.ts`)
- `/api/data/openf1/*` - OpenF1 API integration for live F1 data
- `/api/races` - Race data management

### Data Flow
1. **Raw Data**: Historical F1 data stored in `data/historical_features.csv`
2. **Feature Engineering**: Scripts process raw data into features
3. **Model Storage**: Coefficients stored in Postgres (`model_coeffs` table) and `data/model.json`
4. **Prediction Pipeline**: API endpoints use logistic regression with stored coefficients
5. **Agent Interface**: AI agent normalizes user queries and calls prediction tools

### Database Schema
- `features_current` - Current race/driver features for predictions
- `model_coeffs` - Trained model coefficients (feature weights)
- `eval_runs` - Model evaluation run metadata
- `eval_samples` - Individual prediction samples for evaluation

### Agent System
- **LLM**: Groq Llama 3.1 with structured tool calling
- **Tools**: `get_prediction` and `run_eval` with input normalization
- **Input Processing**: Converts natural language ("Lando Norris", "British GP 2024") to internal IDs (NOR, 2024_gbr)
- **Data Sources**: Bundled driver/race JSON files for normalization

## Environment Variables

### Required for Full Functionality
- `NEON_DATABASE_URL` - Neon PostgreSQL connection string (required for predictions, evals, seeding)
- `GROQ_API_KEY` - Groq API key for agent functionality

### Optional
- `NEXT_PUBLIC_APP_URL` - Public app URL (auto-detected in most cases)
- `VERCEL_URL` - Vercel deployment URL (auto-provided by Vercel)

## Key Features
- **F1 Race Prediction**: Probability scoring using logistic regression with 6 key features (quali position, long-run pace, team/driver form, circuit effects, weather risk)
- **Explainable AI**: Feature attributions show which factors drive predictions
- **Natural Language Interface**: AI agent interprets free-form queries about race predictions
- **Model Evaluation**: Brier score and log-loss metrics on historical data
- **Live Data Integration**: OpenF1 API integration for real-time race data

## Development Notes
- Uses `tsx` for TypeScript execution in scripts
- Turbopack enabled for faster development builds (`--turbopack` flag)
- Memory optimization configured for large builds (4GB heap size)
- Cron job configured for daily data refresh (`/api/data/openf1/pulse`)
- Rate limiting implemented in agent API (30 requests per minute per IP)