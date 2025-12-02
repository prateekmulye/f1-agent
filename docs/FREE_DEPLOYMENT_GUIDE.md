# Free Deployment Guide for F1-Slipstream

This guide will help you deploy F1-Slipstream completely free using free-tier services with automatic rate limiting to stay within limits.

## Architecture Overview

```
User → Render (Free Web Service) → Streamlit UI
                ↓
         FastAPI Backend
                ↓
    ┌───────────┼───────────┐
    ↓           ↓           ↓
OpenAI API  Pinecone    Tavily API
(Free tier) (Free tier) (Free tier)
```

## Free Tier Limits

| Service | Free Tier Limit | Rate Limit Strategy |
|---------|----------------|---------------------|
| **Render** | 750 hours/month | Auto-sleep after 15min inactivity |
| **OpenAI** | $5 credit (new accounts) | 3 RPM, 200 RPD |
| **Pinecone** | 1 index, 100K vectors | 10 queries/sec |
| **Tavily** | 1000 searches/month | 33 searches/day |
| **Upstash Redis** | 10K commands/day | Cache with TTL |

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Ensure your code is in a Git repository
cd apps/f1-slipstream-agent
git init
git add .
git commit -m "Initial commit for deployment"

# Push to GitHub (create repo first on github.com)
git remote add origin https://github.com/YOUR_USERNAME/f1-slipstream.git
git push -u origin main
```

### 2. Sign Up for Free Services

#### A. Render (Hosting)
1. Go to https://render.com
2. Sign up with GitHub
3. Free tier: 750 hours/month, auto-sleep after 15min

#### B. OpenAI (LLM)
1. Go to https://platform.openai.com
2. Sign up (get $5 free credit)
3. Create API key at https://platform.openai.com/api-keys
4. Set usage limits: Dashboard → Usage limits → Set to $5/month

#### C. Pinecone (Vector Store)
1. Go to https://www.pinecone.io
2. Sign up for free Starter plan
3. Create API key
4. Free tier: 1 index, 100K vectors, 2M queries/month

#### D. Tavily (Search)
1. Go to https://tavily.com
2. Sign up for free tier
3. Get API key
4. Free tier: 1000 searches/month

#### E. Upstash Redis (Optional - Caching)
1. Go to https://upstash.com
2. Sign up for free tier
3. Create Redis database
4. Free tier: 10K commands/day

### 3. Configure Rate Limiting

The application includes built-in rate limiting to stay within free tiers.

### 4. Deploy to Render

#### Option A: Deploy via Render Dashboard (Recommended)

1. **Create Web Service for UI**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `f1-slipstream-ui`
     - **Region**: Choose closest to you
     - **Branch**: `main`
     - **Root Directory**: `apps/f1-slipstream-agent`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `streamlit run src/ui/app.py --server.port $PORT --server.address 0.0.0.0 --server.headless true`
     - **Instance Type**: `Free`

2. **Add Environment Variables**
   Click "Environment" and add:
   ```
   OPENAI_API_KEY=your_openai_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_INDEX_NAME=f1-knowledge-free
   TAVILY_API_KEY=your_tavily_key
   ENVIRONMENT=production
   LOG_LEVEL=INFO
   
   # Rate Limiting
   MAX_REQUESTS_PER_MINUTE=3
   MAX_REQUESTS_PER_DAY=100
   ENABLE_RATE_LIMITING=true
   
   # OpenAI Settings (stay in free tier)
   OPENAI_MODEL=gpt-3.5-turbo
   OPENAI_MAX_TOKENS=500
   OPENAI_TEMPERATURE=0.7
   
   # Tavily Settings
   TAVILY_MAX_RESULTS=3
   TAVILY_DAILY_LIMIT=30
   ```

3. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your app will be live at: `https://f1-slipstream-ui.onrender.com`

#### Option B: Deploy via render.yaml (Infrastructure as Code)

Use the provided `render.yaml` configuration file.

### 5. Initialize Pinecone Index

After deployment, initialize your Pinecone index:

```bash
# Run locally or via Render shell
python scripts/setup_production_pinecone.py
```

### 6. Ingest Initial Data

```bash
# Ingest F1 knowledge base (one-time setup)
python -m src.ingestion.cli --source data/migration/transformed/ --batch-size 50
```

### 7. Test Your Deployment

1. Visit your Render URL: `https://your-app.onrender.com`
2. Try a simple query: "Who won the 2023 F1 championship?"
3. Check rate limiting works by making multiple requests

### 8. Monitor Usage

#### OpenAI Usage
- Dashboard: https://platform.openai.com/usage
- Set up email alerts for 80% usage

#### Pinecone Usage
- Dashboard: https://app.pinecone.io
- Monitor vector count and queries

#### Tavily Usage
- Dashboard: https://app.tavily.com
- Track daily search count

#### Render Usage
- Dashboard: https://dashboard.render.com
- Monitor hours used (750/month free)

## Cost Protection Strategies

### 1. Aggressive Rate Limiting
- Max 3 requests/minute per user
- Max 100 requests/day per user
- Max 30 Tavily searches/day globally

### 2. Caching
- Cache LLM responses for 1 hour
- Cache vector search results for 30 minutes
- Cache Tavily results for 24 hours

### 3. Request Throttling
- Queue requests during high load
- Show "Please wait" message to users
- Implement exponential backoff

### 4. Auto-Sleep
- Render auto-sleeps after 15min inactivity
- First request after sleep takes ~30 seconds
- Show "Waking up..." message

### 5. Usage Alerts
- Email alerts at 80% of limits
- Automatic shutdown at 95% of limits
- Daily usage reports

## Sharing Your Application

### Public URL
Your app will be available at:
```
https://f1-slipstream-ui.onrender.com
```

### Custom Domain (Optional - Free)
1. Go to Render Dashboard → Your Service → Settings
2. Add custom domain (requires DNS configuration)
3. Render provides free SSL certificate

### Share with Recruiters
Create a simple landing page or README with:
- Live demo link
- Brief description
- Tech stack
- GitHub repository link
- Your contact information

Example message:
```
🏎️ F1-Slipstream - AI-Powered F1 Expert Chatbot

Live Demo: https://f1-slipstream-ui.onrender.com
GitHub: https://github.com/YOUR_USERNAME/f1-slipstream

Built with: Python, LangChain, LangGraph, OpenAI, Pinecone, Streamlit

Note: First load may take 30 seconds as the free tier wakes up.
```

## Troubleshooting

### App is Slow to Load
- **Cause**: Render free tier auto-sleeps after 15min
- **Solution**: Normal behavior, first request wakes it up (~30s)

### Rate Limit Errors
- **Cause**: Exceeded free tier limits
- **Solution**: Wait for rate limit reset (shown in error message)

### Out of OpenAI Credits
- **Cause**: Used all $5 free credit
- **Solution**: Add payment method with $5/month limit

### Pinecone Index Full
- **Cause**: Exceeded 100K vectors
- **Solution**: Delete old vectors or upgrade plan

## Monitoring Dashboard

Access your monitoring at:
- Application logs: Render Dashboard → Logs
- Metrics: Render Dashboard → Metrics
- Custom monitoring: Add Uptime Robot (free)

## Upgrade Path

When you need to scale:

| Service | Free → Paid |
|---------|-------------|
| Render | $7/month (no sleep) |
| OpenAI | Pay-as-you-go ($0.002/1K tokens) |
| Pinecone | $70/month (serverless) |
| Tavily | $50/month (10K searches) |

## Security Checklist

- ✅ API keys in environment variables (not code)
- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ Input validation enabled
- ✅ HTTPS enabled (automatic on Render)
- ✅ Usage limits set on all services

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Logs
2. Check application health: `https://your-app.onrender.com/health`
3. Review rate limit status in UI
4. Check service status pages

## Next Steps

1. ✅ Deploy to Render
2. ✅ Configure environment variables
3. ✅ Initialize Pinecone index
4. ✅ Ingest initial data
5. ✅ Test application
6. ✅ Share with recruiters
7. ✅ Monitor usage daily

---

**Estimated Monthly Cost**: $0 (within free tiers)

**Maximum Cost with Credit Card**: $5-10/month (with all limits set)

**Recommended for**: Portfolio projects, demos, low-traffic applications
