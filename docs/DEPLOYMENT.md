# F1-Slipstream Agent - Deployment Guide

This guide provides step-by-step instructions for deploying the F1-Slipstream Agent in different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Cloud Deployments](#cloud-deployments)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Python 3.11+** - Application runtime
- **Poetry 1.7+** - Dependency management
- **Docker 24+** - Containerization (optional but recommended)
- **Docker Compose 2.0+** - Multi-container orchestration

### Required API Keys

Before deployment, obtain the following API keys:

1. **OpenAI API Key** - [Get it here](https://platform.openai.com/api-keys)
2. **Pinecone API Key** - [Get it here](https://app.pinecone.io/)
3. **Tavily API Key** - [Get it here](https://tavily.com/)
4. **LangSmith API Key** (Optional) - [Get it here](https://smith.langchain.com/)

### System Requirements

#### Minimum Requirements
- CPU: 2 cores
- RAM: 4 GB
- Disk: 10 GB
- Network: Stable internet connection

#### Recommended Requirements
- CPU: 4 cores
- RAM: 8 GB
- Disk: 20 GB
- Network: High-speed internet connection

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd f1-slipstream-agent
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

### 3. Start with Docker Compose

```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access Application

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **UI**: http://localhost:8501

## Local Development

### Using Poetry

#### 1. Install Dependencies

```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Install project dependencies
poetry install
```

#### 2. Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

#### 3. Run Services

```bash
# Activate virtual environment
poetry shell

# Run API server
poetry run uvicorn src.api.main:app --reload

# In another terminal, run UI
poetry run streamlit run src/ui/app.py
```

### Using Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run services
uvicorn src.api.main:app --reload
streamlit run src/ui/app.py
```

## Docker Deployment

### Development Mode

Development mode includes hot-reload and development tools.

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Mode

Production mode is optimized for performance and security.

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost:8000/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Using Makefile

```bash
# Development
make docker-build
make docker-up
make docker-logs

# Production
make docker-build-prod
make docker-up-prod

# Health check
make docker-health

# Cleanup
make docker-down
make docker-clean
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All API keys obtained and validated
- [ ] Environment configuration reviewed
- [ ] Secrets properly managed (not in code)
- [ ] Configuration validated: `python scripts/validate_config.py --env production --strict`
- [ ] Pinecone index created and populated
- [ ] Backup and rollback plan prepared
- [ ] Monitoring and alerting configured
- [ ] SSL/TLS certificates obtained (if applicable)
- [ ] Domain names configured (if applicable)

### Step-by-Step Production Deployment

#### 1. Prepare Environment

```bash
# Create production environment file
cp .env.production .env.prod.local

# Edit with actual production values
nano .env.prod.local

# IMPORTANT: Set strong secret key
export SECRET_KEY=$(openssl rand -hex 32)
echo "SECRET_KEY=$SECRET_KEY" >> .env.prod.local
```

#### 2. Validate Configuration

```bash
# Validate all settings
python scripts/validate_config.py --env-file .env.prod.local --strict

# Check for placeholder values
grep -E "(your_|_here)" .env.prod.local && echo "ERROR: Found placeholders!"
```

#### 3. Build Production Images

```bash
# Build optimized production images
docker-compose -f docker-compose.prod.yml build --no-cache

# Tag images for registry (optional)
docker tag f1-slipstream-api:latest your-registry/f1-slipstream-api:v1.0.0
docker tag f1-slipstream-ui:latest your-registry/f1-slipstream-ui:v1.0.0
```

#### 4. Initialize Vector Store

```bash
# Run data ingestion
docker-compose -f docker-compose.prod.yml run --rm api \
  python -m src.ingestion.cli ingest --source data/

# Verify ingestion
docker-compose -f docker-compose.prod.yml run --rm api \
  python -m src.ingestion.cli stats
```

#### 5. Start Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
sleep 30

# Check health
curl -f http://localhost:8000/health || echo "API not healthy!"
```

#### 6. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=100

# Test API endpoint
curl http://localhost:8000/health

# Test UI (if accessible)
curl http://localhost:8501/_stcore/health
```

#### 7. Configure Reverse Proxy (Optional)

If using Nginx as reverse proxy:

```nginx
# /etc/nginx/sites-available/f1-slipstream
server {
    listen 80;
    server_name api.f1-slipstream.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name ui.f1-slipstream.com;

    location / {
        proxy_pass http://localhost:8501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/f1-slipstream /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Cloud Deployments

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Push Images to ECR**

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag f1-slipstream-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/f1-slipstream-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/f1-slipstream-api:latest
```

2. **Create ECS Task Definition**

```json
{
  "family": "f1-slipstream-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/f1-slipstream-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:f1-slipstream/openai-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/f1-slipstream-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

3. **Create ECS Service**

```bash
aws ecs create-service \
  --cluster f1-slipstream-cluster \
  --service-name f1-slipstream-api \
  --task-definition f1-slipstream-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/f1-slipstream-api

# Deploy to Cloud Run
gcloud run deploy f1-slipstream-api \
  --image gcr.io/<project-id>/f1-slipstream-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production \
  --set-secrets OPENAI_API_KEY=openai-api-key:latest
```

### Azure

#### Using Azure Container Instances

```bash
# Create resource group
az group create --name f1-slipstream-rg --location eastus

# Create container instance
az container create \
  --resource-group f1-slipstream-rg \
  --name f1-slipstream-api \
  --image <registry>/f1-slipstream-api:latest \
  --cpu 2 \
  --memory 4 \
  --ports 8000 \
  --environment-variables ENVIRONMENT=production \
  --secure-environment-variables \
    OPENAI_API_KEY=<key> \
    PINECONE_API_KEY=<key> \
    TAVILY_API_KEY=<key>
```

### Kubernetes

#### Deployment Manifests

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: f1-slipstream-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: f1-slipstream-api
  template:
    metadata:
      labels:
        app: f1-slipstream-api
    spec:
      containers:
      - name: api
        image: f1-slipstream-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: f1-slipstream-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: f1-slipstream-api
spec:
  selector:
    app: f1-slipstream-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

Deploy to Kubernetes:

```bash
# Create secrets
kubectl create secret generic f1-slipstream-secrets \
  --from-literal=openai-api-key=<key> \
  --from-literal=pinecone-api-key=<key> \
  --from-literal=tavily-api-key=<key>

# Apply deployment
kubectl apply -f deployment.yaml

# Check status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/f1-slipstream-api
```

## Monitoring and Maintenance

### Health Checks

```bash
# API health check
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "version": "0.1.0", "timestamp": "..."}

# UI health check
curl http://localhost:8501/_stcore/health
```

### Viewing Logs

```bash
# Docker Compose
docker-compose logs -f api
docker-compose logs -f ui

# Docker (specific container)
docker logs -f f1-slipstream-api-prod

# Kubernetes
kubectl logs -f deployment/f1-slipstream-api
```

### Monitoring Metrics

If metrics are enabled:

```bash
# Access Prometheus metrics
curl http://localhost:9090/metrics

# Common metrics to monitor:
# - request_count
# - request_duration_seconds
# - error_rate
# - token_usage
# - vector_search_latency
```

### Backup and Restore

#### Backup Configuration

```bash
# Backup environment configuration
cp .env.production .env.production.backup.$(date +%Y%m%d)

# Backup Docker volumes
docker run --rm -v f1-slipstream_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/data-backup-$(date +%Y%m%d).tar.gz /data
```

#### Restore Configuration

```bash
# Restore environment
cp .env.production.backup.20240101 .env.production

# Restore Docker volumes
docker run --rm -v f1-slipstream_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/data-backup-20240101.tar.gz -C /
```

### Updates and Rollbacks

#### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Rolling update
docker-compose -f docker-compose.prod.yml up -d

# Verify update
docker-compose -f docker-compose.prod.yml ps
```

#### Rollback

```bash
# Stop current version
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### 1. API Not Starting

**Symptoms**: Container exits immediately or health check fails

**Solutions**:

```bash
# Check logs
docker-compose logs api

# Common causes:
# - Missing environment variables
# - Invalid API keys
# - Port already in use

# Validate configuration
python scripts/validate_config.py --env production

# Check port availability
lsof -i :8000
```

#### 2. Vector Store Connection Failed

**Symptoms**: "Failed to connect to Pinecone" errors

**Solutions**:

```bash
# Verify Pinecone API key
curl -X GET "https://api.pinecone.io/indexes" \
  -H "Api-Key: $PINECONE_API_KEY"

# Check index exists
# Log into Pinecone console and verify index name

# Verify environment variable
docker-compose exec api env | grep PINECONE
```

#### 3. OpenAI API Errors

**Symptoms**: "Invalid API key" or rate limit errors

**Solutions**:

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check rate limits
# Log into OpenAI dashboard and check usage

# Verify model availability
# Ensure you have access to the specified model
```

#### 4. High Memory Usage

**Symptoms**: Container OOM killed or slow performance

**Solutions**:

```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 4G

# Reduce batch sizes in configuration
INGESTION_BATCH_SIZE=50
```

#### 5. Slow Response Times

**Symptoms**: Requests taking > 5 seconds

**Solutions**:

```bash
# Check API logs for bottlenecks
docker-compose logs api | grep "duration"

# Enable caching
CACHE_ENABLED=true
CACHE_TTL=3600

# Optimize vector search
PINECONE_TOP_K=3  # Reduce number of results

# Scale horizontally
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Set log level to DEBUG
export LOG_LEVEL=DEBUG

# Restart services
docker-compose restart

# View detailed logs
docker-compose logs -f | grep DEBUG
```

### Getting Help

If you encounter issues not covered here:

1. Check application logs: `docker-compose logs -f`
2. Validate configuration: `python scripts/validate_config.py`
3. Review [GitHub Issues](https://github.com/your-repo/issues)
4. Check [Documentation](./README.md)
5. Contact support team

## Additional Resources

- [Configuration Guide](./CONFIGURATION.md)
- [Secrets Management](./SECRETS_MANAGEMENT.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](http://localhost:8000/docs)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
