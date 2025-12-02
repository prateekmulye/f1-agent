# F1-Slipstream Free Deployment Checklist

Complete this checklist to deploy F1-Slipstream for free with proper rate limiting.

## Pre-Deployment Setup

### 1. Service Accounts (All Free Tier)

- [ ] **GitHub Account**
  - Create account at https://github.com
  - Create new repository: `f1-slipstream`
  - Make it public (required for free Render deployment)

- [ ] **Render Account** (Hosting - FREE)
  - Sign up at https://render.com
  - Connect GitHub account
  - Free tier: 750 hours/month, auto-sleep after 15min

- [ ] **OpenAI Account** (LLM - $5 FREE CREDIT)
  - Sign up at https://platform.openai.com
  - Get $5 free credit (new accounts)
  - Create API key: https://platform.openai.com/api-keys
  - Set usage limit: $5/month max
  - Copy API key: `sk-...`

- [ ] **Pinecone Account** (Vector Store - FREE)
  - Sign up at https://www.pinecone.io
  - Choose Starter (free) plan
  - Create API key
  - Free tier: 1 index, 100K vectors, 2M queries/month
  - Copy API key: `pcsk_...`

- [ ] **Tavily Account** (Search - FREE)
  - Sign up at https://tavily.com
  - Free tier: 1000 searches/month
  - Create API key
  - Copy API key: `tvly-...`

### 2. Repository Setup

- [ ] Initialize Git repository
  ```bash
  cd apps/f1-slipstream-agent
  git init
  git add .
  git commit -m "Initial commit for deployment"
  ```

- [ ] Push to GitHub
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/f1-slipstream.git
  git branch -M main
  git push -u origin main
  ```

- [ ] Verify code is on GitHub
  - Visit your repository URL
  - Ensure all files are present

### 3. Pinecone Index Setup

- [ ] Set environment variable
  ```bash
  export PINECONE_API_KEY='your-pinecone-key'
  export PINECONE_INDEX_NAME='f1-knowledge-free'
  ```

- [ ] Create Pinecone index
  ```bash
  python scripts/setup_production_pinecone.py
  ```

- [ ] Verify index created
  - Check Pinecone dashboard: https://app.pinecone.io
  - Should see `f1-knowledge-free` index

### 4. Data Ingestion (Optional - Can do after deployment)

- [ ] Prepare F1 data
  - Ensure data is in `data/migration/transformed/`
  - Or use existing data

- [ ] Ingest data to Pinecone
  ```bash
  python -m src.ingestion.cli --source data/migration/transformed/ --batch-size 50
  ```

- [ ] Verify data ingested
  - Check vector count in Pinecone dashboard
  - Should have 1000+ vectors

## Render Deployment

### 5. Deploy to Render

#### Option A: Manual Deployment (Recommended for first time)

- [ ] Go to Render Dashboard: https://dashboard.render.com

- [ ] Create new Web Service
  - Click "New +" → "Web Service"
  - Connect GitHub repository
  - Select your `f1-slipstream` repository

- [ ] Configure Service
  - **Name**: `f1-slipstream-ui`
  - **Region**: Choose closest to you (e.g., Oregon)
  - **Branch**: `main`
  - **Root Directory**: `apps/f1-slipstream-agent`
  - **Runtime**: `Python 3`
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: 
    ```
    streamlit run src/ui/app.py --server.port $PORT --server.address 0.0.0.0 --server.headless true
    ```
  - **Instance Type**: `Free`

- [ ] Add Environment Variables (Click "Environment" tab)
  ```
  OPENAI_API_KEY=sk-...
  PINECONE_API_KEY=pcsk_...
  PINECONE_INDEX_NAME=f1-knowledge-free
  TAVILY_API_KEY=tvly-...
  ENVIRONMENT=production
  LOG_LEVEL=INFO
  OPENAI_MODEL=gpt-3.5-turbo
  OPENAI_MAX_TOKENS=500
  MAX_REQUESTS_PER_MINUTE=3
  MAX_REQUESTS_PER_DAY=100
  ENABLE_RATE_LIMITING=true
  TAVILY_MAX_RESULTS=3
  TAVILY_DAILY_LIMIT=30
  CACHE_TTL_SECONDS=3600
  ENABLE_CACHING=true
  ```

- [ ] Create Web Service
  - Click "Create Web Service"
  - Wait 5-10 minutes for deployment

#### Option B: Blueprint Deployment (Faster)

- [ ] Copy `render.yaml` to repository root
  ```bash
  cp apps/f1-slipstream-agent/render.yaml .
  git add render.yaml
  git commit -m "Add Render blueprint"
  git push
  ```

- [ ] Deploy via Blueprint
  - In Render Dashboard, click "New +" → "Blueprint"
  - Connect repository
  - Add environment variables (secrets)
  - Deploy

### 6. Verify Deployment

- [ ] Check deployment logs
  - In Render Dashboard → Your Service → Logs
  - Look for "You can now view your Streamlit app"

- [ ] Test application
  - Visit your Render URL: `https://f1-slipstream-ui.onrender.com`
  - First load takes ~30 seconds (waking up from sleep)
  - Try a simple query: "Who won the 2023 F1 championship?"

- [ ] Verify rate limiting
  - Make 4 requests quickly
  - Should see rate limit message on 4th request

- [ ] Check health endpoint
  - Visit: `https://your-app.onrender.com/health`
  - Should return healthy status

## Post-Deployment

### 7. Monitor Usage

- [ ] Set up OpenAI usage alerts
  - Go to https://platform.openai.com/usage
  - Set email alert at 80% of $5 limit

- [ ] Monitor Pinecone usage
  - Check https://app.pinecone.io
  - Monitor vector count (max 100K free)
  - Monitor query count

- [ ] Monitor Tavily usage
  - Check https://app.tavily.com
  - Track daily searches (max 30/day recommended)

- [ ] Monitor Render usage
  - Check https://dashboard.render.com
  - Track hours used (750/month free)

### 8. Share Your Application

- [ ] Get your public URL
  - Copy from Render Dashboard
  - Format: `https://f1-slipstream-ui.onrender.com`

- [ ] Create shareable link
  - Add to your resume/portfolio
  - Share with recruiters
  - Post on LinkedIn

- [ ] Add to GitHub README
  ```markdown
  ## Live Demo
  
  🚀 [Try F1-Slipstream Live](https://f1-slipstream-ui.onrender.com)
  
  *Note: First load may take 30 seconds as the free tier wakes up.*
  ```

### 9. Optional Enhancements

- [ ] Add custom domain (free on Render)
  - Go to Service Settings → Custom Domain
  - Add your domain
  - Configure DNS

- [ ] Set up uptime monitoring
  - Use UptimeRobot (free): https://uptimerobot.com
  - Monitor your Render URL
  - Get alerts if app goes down

- [ ] Add analytics
  - Google Analytics (free)
  - Track user interactions

## Cost Protection

### 10. Safety Measures

- [ ] Verify rate limiting is working
  - Test by making multiple requests
  - Should block after limits

- [ ] Set OpenAI hard limit
  - Platform → Usage limits → Set $5 hard limit
  - Add credit card with $5/month limit

- [ ] Enable Render auto-sleep
  - Enabled by default on free tier
  - Sleeps after 15min inactivity

- [ ] Monitor daily
  - Check usage dashboards daily for first week
  - Adjust limits if needed

## Troubleshooting

### Common Issues

- [ ] **App won't start**
  - Check Render logs for errors
  - Verify all environment variables are set
  - Check Python version compatibility

- [ ] **Rate limit errors**
  - Normal behavior - working as intended
  - Adjust limits in environment variables if needed

- [ ] **Slow first load**
  - Normal on free tier (cold start ~30s)
  - Add note to users about first load time

- [ ] **Out of OpenAI credits**
  - Add payment method
  - Set $5/month limit
  - Monitor usage more closely

- [ ] **Pinecone index full**
  - Delete old vectors
  - Or upgrade to paid plan

## Success Criteria

- [x] Application is live and accessible
- [x] Rate limiting is working
- [x] All API integrations working
- [x] Monitoring is set up
- [x] Usage alerts configured
- [x] Shareable link ready

## Estimated Costs

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|------------------------|
| Render | 750 hours | $0 |
| OpenAI | $5 credit | $0-5 |
| Pinecone | 100K vectors | $0 |
| Tavily | 1000 searches | $0 |
| **Total** | | **$0-5/month** |

## Support

If you encounter issues:

1. Check deployment guide: `docs/FREE_DEPLOYMENT_GUIDE.md`
2. Review Render logs
3. Check service status pages
4. Verify API keys are correct

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Public URL**: _______________

**Notes**:
