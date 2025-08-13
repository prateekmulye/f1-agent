# F1 Agent — Race Predictor & Explainable Insights

Live: https://f1-agent.vercel.app

## What it does
Predicts F1 race outcomes from recent form, quali pace, tyre/strategy signals, and track history, then explains *why* with feature attributions and natural-language rationales.

## Tech
- **Frontend:** Next.js/TypeScript (monorepo: `apps/web`)
- **Data/ML:** Python (feature engineering, models), CSV/Parquet in `/data`
- **Infra:** Vercel for web; GitHub Actions for CI

## Architecture (Mermaid)
```mermaid
flowchart LR
A[Data Sources: results, quali, laps] --> B[Feature Engineering (Python)]
B --> C[Model Inference]
C --> D[Explainability (shap-like attributions + NL summary)]
D --> E[API/Edge Functions]
E --> F[Next.js UI]
