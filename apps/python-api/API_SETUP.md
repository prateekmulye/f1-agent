# F1 API Setup Guide

## Overview

The F1 prediction system now uses a Python FastAPI backend with JSON data fallback instead of Next.js API routes.

## Quick Start

### 1. Start the Python API Server

```bash
cd apps/python-api/apps/python-api
python3 simple_main.py
```

The API will be available at:
- **Server**: http://localhost:8001
- **Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/api/v1/health

### 2. Configure Frontend

Set the API base URL in your environment:

```bash
# In apps/web/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

### 3. Test Endpoints

```bash
# Get all drivers for 2025
curl http://localhost:8001/api/v1/drivers?season=2025

# Get all races for 2025
curl http://localhost:8001/api/v1/races?season=2025

# Get all teams for 2025
curl http://localhost:8001/api/v1/teams?season=2025

# Get predictions for a specific race
curl http://localhost:8001/api/v1/predictions/race/2025_bahrain
```

## Architecture

### Current Setup (✅ Working)

```
Frontend (Next.js) → Python FastAPI → JSON Data Files
                   ↗️               ↘️
              localhost:3000    localhost:8001
```

### Data Sources

1. **JSON Files** (`data/` directory):
   - `drivers.json` - Driver information
   - `races.json` - Race calendar
   - `historical_features.csv` - Historical race results

2. **API Endpoints**:
   - `GET /api/v1/drivers` - All drivers
   - `GET /api/v1/teams` - All teams (generated from drivers)
   - `GET /api/v1/races` - All races
   - `GET /api/v1/predictions/race/{race_id}` - Race predictions

### Prediction Logic

- **Future Races**: Uses ML predictions with mock data
- **Past Races**: Returns actual historical results from CSV
- **Data Type Identification**: API response includes metadata about data source

## Troubleshooting

### API Returns 404

1. **Check if API server is running**:
   ```bash
   curl http://localhost:8001/api/v1/health
   ```

2. **Verify data files exist**:
   ```bash
   ls -la data/
   # Should show: drivers.json, races.json, historical_features.csv
   ```

3. **Check frontend API configuration**:
   ```bash
   echo $NEXT_PUBLIC_API_BASE_URL
   # Should show: http://localhost:8001
   ```

### Missing Dependencies

The simple API server has minimal dependencies:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation

Install if missing:
```bash
pip install fastapi uvicorn pydantic
```

## Development

### Running Tests

```bash
cd apps/python-api/apps/python-api
python3 test_data_only.py
```

### Adding New Endpoints

Edit `simple_main.py` and add new FastAPI routes following the existing pattern.

### Data Updates

Update the JSON files in the `data/` directory. The API will automatically use the new data.

## Production Deployment

For production, consider:
1. Use proper environment variables for configuration
2. Set up CORS policies appropriately
3. Add authentication if needed
4. Use a production ASGI server like Gunicorn
5. Set up proper logging and monitoring

## API Documentation

Full interactive API documentation is available at http://localhost:8001/docs when the server is running.