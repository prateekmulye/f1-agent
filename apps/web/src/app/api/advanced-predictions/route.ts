import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface AdvancedPredictionRequest {
  raceId: string;
  driverId?: string;
  includeFeatureExplanation?: boolean;
  confidenceThreshold?: number;
}

interface AdvancedPrediction {
  predictionId: string;
  timestamp: string;
  raceId: string;
  driverId: string;
  prediction: {
    probability: number;
    confidence: number;
    features: {
      [key: string]: {
        value: number;
        importance: number;
        description: string;
      }
    };
    modelConsensus: number;
  };
  dataSourcesUsed: string[];
  modelVersion: string;
}

interface ModelPerformance {
  status: string;
  accuracy: number;
  averageError: number;
  averageConfidence: number;
  totalPredictions: number;
  recentPredictionsWithResults: number;
  lastRetrain: string | null;
  activePredictions: number;
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(', ')[0] : req.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);

  if (!userLimit) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return true;
  }

  if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
    userLimit.count = 1;
    userLimit.lastReset = now;
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request);

  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'predictions';

    if (action === 'performance') {
      return await getModelPerformance();
    } else if (action === 'predictions') {
      return await getCurrentPredictions(searchParams);
    } else {
      return NextResponse.json(
        { error: 'Invalid action parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Advanced predictions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request);

  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const body: AdvancedPredictionRequest = await request.json();

    if (!body.raceId) {
      return NextResponse.json(
        { error: 'raceId is required' },
        { status: 400 }
      );
    }

    return await makeAdvancedPrediction(body);
  } catch (error) {
    console.error('Advanced prediction POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getCurrentPredictions(searchParams: URLSearchParams): Promise<NextResponse> {
  try {
    // Try to get predictions from the real-time pipeline
    const predictionsPath = path.join(process.cwd(), 'data', 'current_predictions.json');

    let predictions: AdvancedPrediction[] = [];

    try {
      const data = await fs.readFile(predictionsPath, 'utf-8');
      predictions = JSON.parse(data);
    } catch (error) {
      // File might not exist if pipeline hasn't run yet
      console.log('No current predictions file found, returning empty array');
    }

    // Filter by race ID if specified
    const raceId = searchParams.get('raceId');
    if (raceId) {
      predictions = predictions.filter(p => p.raceId === raceId);
    }

    // Filter by driver ID if specified
    const driverId = searchParams.get('driverId');
    if (driverId) {
      predictions = predictions.filter(p => p.driverId === driverId);
    }

    // Filter by confidence threshold if specified
    const confidenceThreshold = parseFloat(searchParams.get('confidenceThreshold') || '0');
    if (confidenceThreshold > 0) {
      predictions = predictions.filter(p => p.prediction.confidence >= confidenceThreshold);
    }

    return NextResponse.json({
      success: true,
      predictions,
      total: predictions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting current predictions:', error);
    throw error;
  }
}

async function getModelPerformance(): Promise<NextResponse> {
  try {
    // Try to get performance metrics from the pipeline
    const performancePath = path.join(process.cwd(), 'data', 'model_performance.json');

    let performance: ModelPerformance = {
      status: 'unknown',
      accuracy: 0,
      averageError: 0,
      averageConfidence: 0,
      totalPredictions: 0,
      recentPredictionsWithResults: 0,
      lastRetrain: null,
      activePredictions: 0
    };

    try {
      const data = await fs.readFile(performancePath, 'utf-8');
      performance = JSON.parse(data);
    } catch (error) {
      console.log('No performance metrics file found, returning default values');
    }

    return NextResponse.json({
      success: true,
      performance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting model performance:', error);
    throw error;
  }
}

async function makeAdvancedPrediction(request: AdvancedPredictionRequest): Promise<NextResponse> {
  try {
    // Validate race ID format
    const raceIdPattern = /^\d{4}_\d+_\w+$/;
    if (!raceIdPattern.test(request.raceId)) {
      return NextResponse.json(
        { error: 'Invalid race ID format. Expected: YYYY_ROUND_CIRCUIT' },
        { status: 400 }
      );
    }

    // Run the advanced prediction script
    const scriptPath = path.join(process.cwd(), 'scripts', 'make_advanced_prediction.py');
    const pythonPath = path.join(process.cwd(), 'apps', 'web', 'venv', 'bin', 'python');

    const command = `${pythonPath} ${scriptPath} --race-id "${request.raceId}"` +
      (request.driverId ? ` --driver-id "${request.driverId}"` : '') +
      (request.includeFeatureExplanation ? ' --include-features' : '') +
      (request.confidenceThreshold ? ` --confidence-threshold ${request.confidenceThreshold}` : '');

    console.log('Running advanced prediction command:', command);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
      cwd: process.cwd()
    });

    if (stderr) {
      console.warn('Advanced prediction stderr:', stderr);
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      console.error('Failed to parse prediction result:', stdout);
      throw new Error('Invalid prediction result format');
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Prediction failed' },
        { status: 400 }
      );
    }

    // Format the response
    const predictions: AdvancedPrediction[] = result.predictions.map((pred: any) => ({
      predictionId: pred.prediction_id,
      timestamp: pred.timestamp,
      raceId: pred.race_id,
      driverId: pred.driver_id,
      prediction: {
        probability: pred.prediction_probability,
        confidence: pred.confidence,
        features: pred.features || {},
        modelConsensus: pred.model_consensus || 1
      },
      dataSourcesUsed: pred.data_sources_used || ['historical'],
      modelVersion: pred.model_version || 'ensemble_v2.0'
    }));

    return NextResponse.json({
      success: true,
      predictions,
      metadata: {
        raceId: request.raceId,
        timestamp: new Date().toISOString(),
        modelVersion: result.model_version || 'ensemble_v2.0',
        dataSourcesUsed: result.data_sources_used || ['historical']
      }
    });

  } catch (error) {
    console.error('Advanced prediction error:', error);

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Prediction request timed out' },
          { status: 408 }
        );
      }

      if (error.message.includes('No such file')) {
        return NextResponse.json(
          { error: 'Prediction system not properly configured' },
          { status: 503 }
        );
      }
    }

    throw error;
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}