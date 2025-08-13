# F1 Agent — Race Predictor & Explainable Insights

**Last updated:** Aug 13, 2025  
**Live Demo:** https://f1-agent.vercel.app

Predicts F1 race outcomes from recent form, quali pace, tyre/strategy signals, and track history — then explains *why* with feature attributions and natural‑language rationales.

## Tech Stack
- **Frontend:** Next.js · TypeScript (`apps/web`)
- **Data/ML:** Python (feature engineering, model training/inference), CSV/Parquet in `/data`
- **Infra:** Vercel for web; GitHub Actions for CI; optional local dev with `pnpm` + Python venv

## Architecture
```mermaid
flowchart LR
  A[Raw Data: results, quali, laps, track attrs]
  B[Feature Engineering — Python]
  C[Model Inference]
  D[Explainability (attributions and NL)]
  E[API / Edge Functions]
  F[Next.js UI]

  A --> B
  B --> C
  C --> D
  D --> E
  E --> F

```
- **Feature Engineering:** aggregates last N races, team/driver deltas, track-specific coefficients, weather proxies (if present).
- **Models:** start with simple baselines (logistic/GBM) then iterate; keep model cards in `/models` to document choices.
- **Explainability:** SHAP-like or permutation-attribution summaries → rendered as bar charts and natural-language notes.

## Local Development
```bash
# Web
corepack enable
pnpm i && pnpm --filter web dev

# Python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

## Example: Explainability Output
```json
{
  "race_id": "demo-001",
  "prediction": { "driver": "VER", "p_win": 0.42, "p_podium": 0.78 },
  "top_features": [
    { "feature": "quali_delta", "value": -0.18, "attribution": 0.34 },
    { "feature": "long_run_pace", "value": 0.27, "attribution": 0.21 },
    { "feature": "track_history_driver", "value": 0.31, "attribution": 0.17 },
    { "feature": "pit_stop_efficiency_team", "value": 0.09, "attribution": 0.11 }
  ],
  "notes": [
    "Qualifying pace relative to field strongly favors the prediction.",
    "Long-run pace in FP sessions is a secondary contributor.",
    "Driver's past results at this circuit add confidence."
  ]
}
```
> The UI renders these attributions as a chart plus a short paragraph explaining impact and direction.

## Datasets
- Place raw CSV/Parquet in `/data/raw`. Any derived features go under `/data/processed` (gitignored).
- Add a short **Datasheet** (`/data/DATASET.md`) describing provenance, cleaning, and known limitations.

## Testing
- Python unit tests for feature builders (`tests/feature_builders_test.py`).
- A lightweight integration test exercises the end-to-end prediction path with a small fixture.

## CI (GitHub Actions)
See `.github/workflows/ci.yml` for Node and Python jobs (build + tests).

## Roadmap
- [ ] Per-track feature weights
- [ ] Strategy simulation (pit windows & tyre compounds)
- [ ] Model cards + dataset datasheet
- [ ] Export JSON for downstream agents

## License
Apache-2.0
