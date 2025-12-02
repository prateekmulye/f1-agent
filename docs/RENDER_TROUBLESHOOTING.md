# 🔧 Render Deployment Troubleshooting

Common issues and solutions when deploying to Render.

---

## Build Failures

### Issue: "failed to calculate checksum" or "file not found"

**Error Message:**
```
#16 ERROR: failed to calculate checksum of ref... '/README.md': not found
```

**Cause:**
- `.dockerignore` is excluding files that `Dockerfile` tries to copy
- Mismatch between what's ignored and what's needed

**Solution:**
1. Check `.dockerignore` for overly broad exclusions (like `*.md`)
2. Either:
   - Remove the file from `.dockerignore`, OR
   - Remove the `COPY` command from `Dockerfile` if file isn't needed

**Example Fix:**
```dockerfile
# Before (in Dockerfile)
COPY README.md ./

# After (remove if not needed at runtime)
# COPY README.md ./  # Not needed
```

---

### Issue: "poetry: command not found"

**Error Message:**
```
poetry: command not found
```

**Cause:**
- Poetry not installed in Docker image
- PATH not set correctly

**Solution:**
Update Dockerfile to install Poetry:
```dockerfile
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    poetry --version
```

---

### Issue: "Module not found" errors

**Error Message:**
```
ModuleNotFoundError: No module named 'langchain'
```

**Cause:**
- Dependencies not installed
- Wrong Python path
- Virtual environment not activated

**Solution:**
1. Ensure `poetry install` runs in Dockerfile
2. Set PATH to include virtual environment:
   ```dockerfile
   ENV PATH="/app/.venv/bin:$PATH"
   ```

---

## Runtime Failures

### Issue: Application exits immediately

**Symptoms:**
- Container starts but exits with code 1
- No logs or minimal logs

**Causes & Solutions:**

1. **Missing environment variables**
   ```bash
   # Check Render Dashboard → Environment
   # Ensure all required vars are set:
   OPENAI_API_KEY
   PINECONE_API_KEY
   TAVILY_API_KEY
   ```

2. **Wrong start command**
   ```bash
   # For Streamlit UI:
   streamlit run src/ui/app.py --server.port $PORT --server.address 0.0.0.0 --server.headless true
   
   # For FastAPI:
   uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Port binding issues**
   - Render provides `$PORT` environment variable
   - Always use `$PORT` instead of hardcoded port

---

### Issue: "Address already in use"

**Error Message:**
```
OSError: [Errno 98] Address already in use
```

**Cause:**
- Trying to bind to a port that's already in use
- Not using Render's `$PORT` variable

**Solution:**
Update start command to use `$PORT`:
```bash
# Streamlit
streamlit run src/ui/app.py --server.port $PORT

# FastAPI
uvicorn src.api.main:app --port $PORT
```

---

### Issue: Health checks failing

**Symptoms:**
- Deployment succeeds but service marked as unhealthy
- Frequent restarts

**Causes & Solutions:**

1. **No health endpoint**
   ```python
   # Add to FastAPI app
   @app.get("/health")
   async def health():
       return {"status": "healthy"}
   ```

2. **Wrong health check path**
   ```yaml
   # In render.yaml
   healthCheckPath: /health  # Ensure this matches your endpoint
   ```

3. **Slow startup**
   ```yaml
   # Increase initial delay
   healthCheckPath: /health
   initialDelaySeconds: 30  # Give app time to start
   ```

---

## Deployment Issues

### Issue: Deployment stuck or very slow

**Symptoms:**
- Build takes 10+ minutes
- Deployment never completes

**Solutions:**

1. **Enable build caching**
   ```dockerfile
   # Use multi-stage builds
   FROM python:3.11-slim as builder
   # ... install dependencies
   
   FROM python:3.11-slim as production
   COPY --from=builder /app/.venv /app/.venv
   ```

2. **Reduce image size**
   ```dockerfile
   # Use slim base images
   FROM python:3.11-slim  # Not python:3.11
   
   # Clean up after installs
   RUN apt-get update && apt-get install -y curl \
       && rm -rf /var/lib/apt/lists/*
   ```

3. **Check Render status**
   - Visit: https://status.render.com
   - Check for ongoing incidents

---

### Issue: "Out of memory" during build

**Error Message:**
```
Killed
```

**Cause:**
- Build process using too much memory
- Free tier has limited resources

**Solutions:**

1. **Reduce concurrent operations**
   ```bash
   # In poetry install
   poetry install --no-interaction --no-ansi
   ```

2. **Use lighter dependencies**
   ```toml
   # In pyproject.toml, avoid heavy packages
   # Use specific versions to avoid resolving
   ```

3. **Upgrade to paid tier**
   - Free tier: 512MB RAM
   - Starter tier: 2GB RAM

---

## Environment Variable Issues

### Issue: API keys not working

**Symptoms:**
- Authentication errors
- "Invalid API key" messages

**Solutions:**

1. **Check secrets are set**
   ```
   Render Dashboard → Your Service → Environment
   ```

2. **Verify no extra spaces**
   ```bash
   # Bad
   OPENAI_API_KEY= sk-xxxxx  # Extra space
   
   # Good
   OPENAI_API_KEY=sk-xxxxx
   ```

3. **Check for placeholder values**
   ```bash
   # Bad
   OPENAI_API_KEY=your-key-here
   
   # Good
   OPENAI_API_KEY=sk-actual-key-value
   ```

---

## Free Tier Limitations

### Issue: Service sleeps after inactivity

**Symptoms:**
- First request takes 30+ seconds
- "Service unavailable" initially

**This is normal behavior!**

**Solutions:**

1. **Add note to users**
   ```
   "First load may take 30 seconds as the service wakes up"
   ```

2. **Use uptime monitoring** (optional)
   - UptimeRobot: https://uptimerobot.com
   - Ping every 14 minutes to keep warm

3. **Upgrade to paid tier**
   - Paid services don't auto-sleep

---

### Issue: "750 hours exceeded"

**Symptoms:**
- Service stops working
- "Free tier limit exceeded" message

**Solutions:**

1. **Check usage**
   ```
   Render Dashboard → Usage
   ```

2. **Optimize auto-sleep**
   - Ensure service sleeps when not in use
   - Don't use uptime monitoring on free tier

3. **Upgrade to paid tier**
   - $7/month for always-on service

---

## Debugging Tips

### View Logs

```
Render Dashboard → Your Service → Logs
```

**Look for:**
- Error messages
- Stack traces
- Missing environment variables
- Port binding issues

### Test Locally

```bash
# Build Docker image
docker build -t f1-agent:test .

# Run container
docker run -p 8501:8501 \
  -e OPENAI_API_KEY=sk-xxx \
  -e PINECONE_API_KEY=xxx \
  -e TAVILY_API_KEY=xxx \
  f1-agent:test

# Check logs
docker logs <container-id>
```

### Check Health Endpoint

```bash
# Once deployed
curl https://your-app.onrender.com/health

# Should return
{"status": "healthy"}
```

### Verify Environment Variables

Add temporary logging:
```python
import os
print(f"OPENAI_API_KEY set: {bool(os.getenv('OPENAI_API_KEY'))}")
```

---

## Common Render Configuration

### render.yaml

```yaml
services:
  - type: web
    name: f1-slipstream-ui
    runtime: docker
    plan: free
    healthCheckPath: /
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: PINECONE_API_KEY
        sync: false
      - key: TAVILY_API_KEY
        sync: false
      - key: ENVIRONMENT
        value: production
```

### Dockerfile Best Practices

```dockerfile
# Use multi-stage builds
FROM python:3.11-slim as builder
# ... build stage

FROM python:3.11-slim as production
# ... production stage

# Use non-root user
RUN useradd -m appuser
USER appuser

# Set proper environment variables
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/.venv/bin:$PATH"

# Use $PORT from Render
CMD ["streamlit", "run", "src/ui/app.py", "--server.port", "$PORT"]
```

---

## Getting Help

1. **Check Render Docs**: https://render.com/docs
2. **Render Community**: https://community.render.com
3. **Check Status**: https://status.render.com
4. **Review Logs**: Render Dashboard → Logs
5. **Test Locally**: Use Docker to reproduce issues

---

## Quick Fixes Checklist

When deployment fails, check:

- [ ] `.dockerignore` not excluding needed files
- [ ] All `COPY` commands in Dockerfile reference existing files
- [ ] Environment variables set in Render Dashboard
- [ ] Start command uses `$PORT` variable
- [ ] Health check endpoint exists and responds
- [ ] Dependencies installed correctly
- [ ] No hardcoded ports or paths
- [ ] Base image is appropriate (use `-slim` variants)
- [ ] Build completes within time/memory limits

---

**Need more help?** Check the [main troubleshooting guide](TROUBLESHOOTING.md) or open an issue on GitHub.
