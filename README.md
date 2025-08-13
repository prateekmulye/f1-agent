# 🏎️ F1 Agent — Race Predictor & Explainable Insights

<div align="center">

[![F1 Logo](https://img.shields.io/badge/F1-Official%20Partner-E10600?style=for-the-badge&logo=formula1&logoColor=white)](https://f1-agent.vercel.app)
[![AI Powered](https://img.shields.io/badge/AI-Powered-5B00FF?style=for-the-badge&logo=openai&logoColor=white)](https://f1-agent.vercel.app)
[![Built with Llama](https://img.shields.io/badge/Built%20with-Llama-FF61F6?style=for-the-badge&logo=meta&logoColor=white)](https://f1-agent.vercel.app)

[Live Demo](https://f1-agent.vercel.app) • [Documentation](#architecture) • [Quick Start](#local-development)

**Last Updated:** Aug 13, 2025
</div>

Predicts F1 race outcomes from recent form, quali pace, tyre/strategy signals, and track history — then explains *why* with feature attributions and natural‑language rationales.

## ⚡ Tech Stack

<table>
<tr>
<td>
  
### 🎨 Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
</td>
<td>

### 🤖 Data/ML
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
</td>
<td>

### ☁️ Infrastructure
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)
</td>
</tr>
</table>

## 🏗️ Architecture

```mermaid
graph TD
    A[🏁 Raw Data] --> B[⚙️ Feature Engineering]
    B --> C[🧠 Model Inference]
    C --> D[💡 Explainability]
    D --> E[⚡ API Functions]
    E --> F[🎨 Next.js UI]
    
    style A fill:#E10600,stroke:#2F2F2F,stroke-width:2px,color:#FFFFFF
    style B fill:#1E1E1E,stroke:#E10600,stroke-width:2px,color:#FFFFFF
    style C fill:#2F2F2F,stroke:#E10600,stroke-width:2px,color:#FFFFFF
    style D fill:#E10600,stroke:#2F2F2F,stroke-width:2px,color:#FFFFFF
    style E fill:#1E1E1E,stroke:#E10600,stroke-width:2px,color:#FFFFFF
    style F fill:#2F2F2F,stroke:#E10600,stroke-width:2px,color:#FFFFFF
    
    linkStyle default stroke:#E10600,stroke-width:2px
```
- **Feature Engineering:** aggregates last N races, team/driver deltas, track-specific coefficients, weather proxies (if present).
- **Models:** start with simple baselines (logistic/GBM) then iterate; keep model cards in `/models` to document choices.
- **Explainability:** SHAP-like or permutation-attribution summaries → rendered as bar charts and natural-language notes.

## 🚀 Quick Start

<details>
<summary>💻 Frontend Setup</summary>

```bash
# Enable pnpm
corepack enable

# Install dependencies and start dev server
pnpm i && pnpm --filter web dev
```
</details>

<details>
<summary>🐍 Python Environment Setup</summary>

```bash
# Create and activate virtual environment
python -m venv .venv && source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest -q
```
</details>

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

## 📊 Datasets
<details>
<summary>Data Organization</summary>

- 📁 Raw data (CSV/Parquet) → `/data/raw`
- 📊 Processed features → `/data/processed` (gitignored)
- 📝 Documentation → `/data/DATASET.md` (provenance & limitations)
</details>

## 🧪 Testing
<details>
<summary>Test Suite Details</summary>

- ✅ Unit tests for feature builders (`tests/feature_builders_test.py`)
- 🔄 Integration tests with minimal fixtures
- 📈 Coverage reports in CI pipeline
</details>

## 🔄 CI/CD
[![CI Status](https://img.shields.io/github/actions/workflow/status/prateekmulye/f1-agent/ci.yml?branch=main&style=for-the-badge&label=CI/CD)](https://github.com/prateekmulye/f1-agent/actions)

Automated workflows in `.github/workflows/ci.yml`:
- 🛠️ Build validation
- 🧪 Test execution
- 📊 Code coverage
- 🚀 Deployment checks

## 🗺️ Roadmap
- [ ] 🎯 Per-track feature weights
- [ ] ⚡ Strategy simulation (pit windows & tyre compounds)
- [ ] 📝 Model cards + dataset datasheet
- [ ] 🔄 Export JSON for downstream agents

## 📄 License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](LICENSE)
