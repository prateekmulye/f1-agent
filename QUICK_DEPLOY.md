# 🚀 Quick Deploy Guide - Get Live in 15 Minutes!

This is the fastest way to get F1-Slipstream live and shareable with recruiters.

## Prerequisites (5 minutes)

1. **Get API Keys** (all free):
   - OpenAI: https://platform.openai.com/api-keys ($5 free credit)
   - Pinecone: https://app.pinecone.io (free starter plan)
   - Tavily: https://app.tavily.com (1000 free searches/month)

2. **GitHub Account**: https://github.com (if you don't have one)

3. **Render Account**: https://render.com (sign up with GitHub)

## Step 1: Prepare Repository (2 minutes)

```bash
# Navigate to project
cd apps/f1-slipstream-agent

# Initialize git (if not already)
git init
git add .
git commit -m "Ready for deployment"

# Create GitHub repository at https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/f1-slipstream.git
git branch -M main
git push -u origin main
```

## Step 2: Setup Pinecone Index (2 minutes)

```bash
# Set your Pinecone API key
export PINECONE_API_KEY='your-pinecone-api-key'

# Create the index
python scripts/setup_production_pinecone.py
```

## Step 3: Deploy to Render (5 minutes)

### Option A: Automated Script

```bash
# Run the deployment helper
./scripts/deploy_to_render.sh
```

Follow the prompts to enter your API keys.

### Option B: Manual (Recommended for first time)

1. Go to https://dashboard.render.com

2. Click **"New +"** → **"Web Service"**

3. Connect your GitHub repository

4. Configure:
   - **Name**: `f1-slipstream-ui`
   - **Root Directory**: `apps/f1-slipstream-agent`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: 
     ```
     streamlit run src/ui/app.py --server.port $PORT --server.address 0.0.0.0 --server.headless true
     ```
   - **Instance Type**: **Free**

5. Add Environment Variables (click "Environment" tab):
   ```
   OPENAI_API_KEY=sk-...
   PINECONE_API_KEY=pcsk_...
   PINECONE_INDEX_NAME=f1-knowledge-free
   TAVILY_API_KEY=tvly-...
   ENVIRONMENT=production
   OPENAI_MODEL=gpt-3.5-turbo
   MAX_REQUESTS_PER_MINUTE=3
   MAX_REQUESTS_PER_DAY=100
   ENABLE_RATE_LIMITING=true
   ```

6. Click **"Create Web Service"**

## Step 4: Wait for Deployment (5 minutes)

- Watch the logs in Render Dashboard
- Deployment takes 5-10 minutes
- You'll see "You can now view your Streamlit app" when ready

## Step 5: Test Your App (1 minute)

1. Visit your URL: `https://f1-slipstream-ui.onrender.com`
2. First load takes ~30 seconds (cold start)
3. Try: "Who won the 2023 F1 championship?"

## 🎉 You're Live!

Your app is now publicly accessible at:
```
https://f1-slipstream-ui.onrender.com
```

## Share with Recruiters

Use this template:

```
Hi [Recruiter Name],

I've built an AI-powered F1 chatbot using LangChain, LangGraph, and RAG architecture.

🚀 Live Demo: https://f1-slipstream-ui.onrender.com
📂 GitHub: https://github.com/YOUR_USERNAME/f1-slipstream

Tech Stack: Python, LangChain, OpenAI, Pinecone, Streamlit

Note: First load takes 30 seconds (free tier cold start).

Best regards,
[Your Name]
```

## Important Notes

### Free Tier Limits
- ✅ Render: 750 hours/month (auto-sleeps after 15min)
- ✅ OpenAI: $5 free credit (set $5/month limit)
- ✅ Pinecone: 100K vectors free
- ✅ Tavily: 1000 searches/month free

### Rate Limiting (Built-in)
- 3 requests per minute per user
- 100 requests per day per user
- Automatic throttling to stay in free tier

### Cost Protection
- Set OpenAI hard limit: Platform → Usage → $5/month
- Monitor daily at: https://platform.openai.com/usage
- Render auto-sleeps = $0 hosting cost

## Troubleshooting

### App won't start?
- Check Render logs for errors
- Verify all environment variables are set
- Ensure API keys are correct

### Slow to load?
- Normal! Free tier sleeps after 15min
- First request wakes it up (~30 seconds)
- Subsequent requests are fast

### Rate limit errors?
- Working as intended!
- Protects your free tier limits
- Users see friendly message

## Next Steps

1. ✅ Add to your resume/portfolio
2. ✅ Share on LinkedIn
3. ✅ Monitor usage daily (first week)
4. ✅ Ingest more F1 data (optional)

## Need Help?

- 📖 Full Guide: `docs/FREE_DEPLOYMENT_GUIDE.md`
- ✅ Checklist: `DEPLOYMENT_CHECKLIST.md`
- 📧 Check Render logs for errors

---

**Estimated Time**: 15 minutes
**Estimated Cost**: $0-5/month
**Difficulty**: Easy

Good luck! 🍀
