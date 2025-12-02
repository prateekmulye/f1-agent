# ⚡ GitHub Actions Quick Start

## Setup (One Time - 5 Minutes)

### 1. Get Render Deploy Hook
```
Render Dashboard → Your Service → Settings → Deploy Hook → Create Deploy Hook
```
Copy the URL: `https://api.render.com/deploy/srv-xxxxx?key=xxxxx`

### 2. Add GitHub Secrets

**Option A: Automated (Recommended)**
```bash
./scripts/setup_github_actions.sh
```

**Option B: Manual**
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
```

Add these secrets:
- **RENDER_DEPLOY_HOOK_URL**: Your deploy hook URL from step 1
- **RENDER_URL**: Your app URL (e.g., `https://f1-slipstream-ui.onrender.com`)

### 3. Enable GitHub Actions
```
GitHub Repo → Actions tab → Enable workflows
```

## Usage

### Regular Commits (CI Only)
```bash
git commit -m "Add new feature"
git push origin main
```
**Result**: Code quality checks + tests run

### Deploy Commits (CI + Deploy)
```bash
git commit -m "deploy: Add caching feature"
git push origin main
```
**Result**: Code quality + tests + deployment to Render

## What Happens

### On Every Push/PR
1. ✅ Black formatting check
2. ✅ Ruff linting
3. ✅ mypy type checking
4. ✅ Unit tests with coverage
5. ✅ Docker image build

### On `deploy:` Commits
1. ✅ All CI checks above
2. ✅ Trigger Render deployment
3. ✅ Wait for deployment
4. ✅ Run health checks
5. ✅ Report status

## Examples

```bash
# Deploy new feature
git commit -m "deploy: Add vector search caching"

# Deploy bug fix
git commit -m "deploy: Fix rate limiter not resetting"

# Deploy version
git commit -m "deploy: Release v1.2.0"

# Regular commit (no deploy)
git commit -m "Update documentation"
git commit -m "Refactor agent code"
```

## Monitor

- **GitHub Actions**: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
- **Render Dashboard**: `https://dashboard.render.com`

## Troubleshooting

### Deployment Not Triggered?
- ✅ Check commit message starts with `deploy:` (lowercase)
- ✅ Verify you pushed to `main` branch
- ✅ Check Actions tab for skip reason

### Tests Failing?
```bash
# Run locally first
poetry run pytest -v
poetry run black src tests
poetry run ruff check src tests
```

### Deployment Failed?
1. Check Render logs: Dashboard → Your Service → Logs
2. Review GitHub Actions logs
3. Verify secrets are set correctly

## Full Documentation

📖 **Complete Guide**: [docs/GITHUB_ACTIONS.md](docs/GITHUB_ACTIONS.md)  
📋 **Quick Reference**: [.github/DEPLOY_GUIDE.md](.github/DEPLOY_GUIDE.md)

---

**That's it! You're ready to deploy with a single commit.** 🚀
