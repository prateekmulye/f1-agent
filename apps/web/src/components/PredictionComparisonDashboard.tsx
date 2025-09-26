'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, AlertTriangle,
  CheckCircle, Clock, Zap, Brain
} from 'lucide-react';

interface PredictionData {
  id: string;
  raceId: string;
  raceName: string;
  driverId: string;
  driverName: string;
  constructorId: string;
  constructorName: string;
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
    timestamp: string;
  };
  actual?: {
    result: number; // 1 if points scored, 0 if not
    position: number;
    points: number;
    timestamp: string;
  };
  error?: number;
  accuracy?: number;
}

interface ModelPerformance {
  overallAccuracy: number;
  brierScore: number;
  rocAuc: number;
  calibrationError: number;
  recentTrend: 'improving' | 'stable' | 'declining';
  totalPredictions: number;
  correctPredictions: number;
}

const CONFIDENCE_COLORS = {
  high: '#10B981', // green
  medium: '#F59E0B', // yellow
  low: '#EF4444' // red
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return CONFIDENCE_COLORS.high;
  if (confidence >= 0.6) return CONFIDENCE_COLORS.medium;
  return CONFIDENCE_COLORS.low;
};

const getAccuracyIcon = (accuracy: number) => {
  if (accuracy >= 0.9) return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (accuracy >= 0.7) return <Target className="w-4 h-4 text-yellow-500" />;
  return <AlertTriangle className="w-4 h-4 text-red-500" />;
};

const PredictionCard: React.FC<{ prediction: PredictionData }> = ({ prediction }) => {
  const hasActual = prediction.actual !== undefined;
  const confidence = prediction.prediction.confidence;
  const probability = prediction.prediction.probability;

  const accuracyBadgeColor = hasActual ?
    (prediction.accuracy! >= 0.8 ? 'bg-green-100 text-green-800' :
     prediction.accuracy! >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
     'bg-red-100 text-red-800') : 'bg-gray-100 text-gray-800';

  return (
    <Card className="mb-4 transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">
              {prediction.driverName}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {prediction.constructorName} • {prediction.raceName}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge className={accuracyBadgeColor}>
              {hasActual ? `${(prediction.accuracy! * 100).toFixed(1)}% accuracy` : 'Pending'}
            </Badge>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Confidence:</span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getConfidenceColor(confidence) }}
              />
              <span className="text-xs font-medium">{(confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Prediction vs Actual */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">AI Prediction</span>
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-1">
                <span className="text-2xl font-bold text-blue-900">
                  {(probability * 100).toFixed(1)}%
                </span>
                <span className="text-sm text-blue-700 ml-1">points chance</span>
              </div>
              <Progress
                value={probability * 100}
                className="mt-2 h-2"
                style={{ '--progress-background': '#3B82F6' } as React.CSSProperties}
              />
            </div>

            <div className={`p-3 rounded-lg ${hasActual ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${hasActual ? 'text-green-700' : 'text-gray-600'}`}>
                  Actual Result
                </span>
                {hasActual ? (
                  getAccuracyIcon(prediction.accuracy!)
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="mt-1">
                {hasActual ? (
                  <>
                    <span className={`text-2xl font-bold ${prediction.actual!.result ? 'text-green-900' : 'text-red-900'}`}>
                      P{prediction.actual!.position}
                    </span>
                    <span className={`text-sm ml-1 ${prediction.actual!.result ? 'text-green-700' : 'text-red-700'}`}>
                      {prediction.actual!.points} pts
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-500">TBD</span>
                )}
              </div>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Key Prediction Factors</h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(prediction.prediction.features)
                .sort(([,a], [,b]) => b.importance - a.importance)
                .slice(0, 3)
                .map(([feature, data]) => (
                  <div key={feature} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 capitalize">
                          {data.description}
                        </span>
                        <span className="text-xs font-medium">
                          {typeof data.value === 'number' ? data.value.toFixed(2) : data.value}
                        </span>
                      </div>
                      <Progress
                        value={data.importance * 100}
                        className="h-1 mt-1"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Error Analysis (if available) */}
          {hasActual && prediction.error !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Prediction Error:</span>
                <span className={`text-xs font-medium ${
                  prediction.error < 0.1 ? 'text-green-600' :
                  prediction.error < 0.3 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(prediction.error * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PerformanceMetrics: React.FC<{ performance: ModelPerformance }> = ({ performance }) => {
  const trendIcon = performance.recentTrend === 'improving' ? (
    <TrendingUp className="w-4 h-4 text-green-500" />
  ) : performance.recentTrend === 'declining' ? (
    <TrendingDown className="w-4 h-4 text-red-500" />
  ) : (
    <Zap className="w-4 h-4 text-yellow-500" />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <span>Model Performance</span>
          {trendIcon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(performance.overallAccuracy * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Overall Accuracy</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {performance.rocAuc.toFixed(3)}
            </div>
            <div className="text-xs text-gray-600">ROC AUC</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {performance.brierScore.toFixed(3)}
            </div>
            <div className="text-xs text-gray-600">Brier Score</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {performance.correctPredictions}/{performance.totalPredictions}
            </div>
            <div className="text-xs text-gray-600">Predictions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PredictionComparisonDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [performance, setPerformance] = useState<ModelPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState<string>('all');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockData: PredictionData[] = [
      {
        id: '1',
        raceId: '2025_1_bahrain',
        raceName: 'Bahrain GP 2025',
        driverId: 'max_verstappen',
        driverName: 'Max Verstappen',
        constructorId: 'red_bull',
        constructorName: 'Red Bull Racing',
        prediction: {
          probability: 0.92,
          confidence: 0.87,
          features: {
            quali_pos: { value: 1, importance: 0.35, description: 'Qualifying Position' },
            constructor_form: { value: 0.85, importance: 0.25, description: 'Constructor Form' },
            driver_form: { value: 0.90, importance: 0.20, description: 'Driver Form' },
            weather_risk: { value: 0.1, importance: 0.15, description: 'Weather Risk' },
            circuit_effect: { value: 0.75, importance: 0.05, description: 'Circuit Performance' }
          },
          modelConsensus: 8,
          timestamp: '2025-03-15T14:00:00Z'
        },
        actual: {
          result: 1,
          position: 1,
          points: 25,
          timestamp: '2025-03-15T16:00:00Z'
        },
        error: 0.08,
        accuracy: 0.92
      },
      {
        id: '2',
        raceId: '2025_1_bahrain',
        raceName: 'Bahrain GP 2025',
        driverId: 'lando_norris',
        driverName: 'Lando Norris',
        constructorId: 'mclaren',
        constructorName: 'McLaren',
        prediction: {
          probability: 0.78,
          confidence: 0.72,
          features: {
            quali_pos: { value: 3, importance: 0.30, description: 'Qualifying Position' },
            constructor_form: { value: 0.75, importance: 0.28, description: 'Constructor Form' },
            driver_form: { value: 0.82, importance: 0.25, description: 'Driver Form' },
            weather_risk: { value: 0.1, importance: 0.12, description: 'Weather Risk' },
            circuit_effect: { value: 0.65, importance: 0.05, description: 'Circuit Performance' }
          },
          modelConsensus: 7,
          timestamp: '2025-03-15T14:00:00Z'
        },
        actual: {
          result: 1,
          position: 2,
          points: 18,
          timestamp: '2025-03-15T16:00:00Z'
        },
        error: 0.22,
        accuracy: 0.78
      },
      {
        id: '3',
        raceId: '2025_2_saudi_arabia',
        raceName: 'Saudi Arabia GP 2025',
        driverId: 'charles_leclerc',
        driverName: 'Charles Leclerc',
        constructorId: 'ferrari',
        constructorName: 'Ferrari',
        prediction: {
          probability: 0.65,
          confidence: 0.58,
          features: {
            quali_pos: { value: 4, importance: 0.32, description: 'Qualifying Position' },
            constructor_form: { value: 0.70, importance: 0.27, description: 'Constructor Form' },
            driver_form: { value: 0.75, importance: 0.23, description: 'Driver Form' },
            weather_risk: { value: 0.05, importance: 0.13, description: 'Weather Risk' },
            circuit_effect: { value: 0.80, importance: 0.05, description: 'Circuit Performance' }
          },
          modelConsensus: 6,
          timestamp: '2025-03-22T14:00:00Z'
        }
      }
    ];

    const mockPerformance: ModelPerformance = {
      overallAccuracy: 0.847,
      brierScore: 0.142,
      rocAuc: 0.886,
      calibrationError: 0.076,
      recentTrend: 'improving',
      totalPredictions: 156,
      correctPredictions: 132
    };

    setPredictions(mockData);
    setPerformance(mockPerformance);
    setLoading(false);
  }, []);

  const filteredPredictions = selectedRace === 'all'
    ? predictions
    : predictions.filter(p => p.raceId === selectedRace);

  const races = Array.from(new Set(predictions.map(p => p.raceId)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Prediction Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Compare AI predictions with actual race results and track model performance
        </p>
      </div>

      {/* Performance Metrics */}
      {performance && <PerformanceMetrics performance={performance} />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="race-select" className="text-sm font-medium text-gray-700">
              Filter by Race:
            </label>
            <select
              id="race-select"
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Races</option>
              {races.map(raceId => {
                const raceName = predictions.find(p => p.raceId === raceId)?.raceName;
                return (
                  <option key={raceId} value={raceId}>
                    {raceName}
                  </option>
                );
              })}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Predictions Grid */}
      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPredictions.map(prediction => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Add charts for prediction accuracy over time, feature importance trends, etc. */}
            <Card>
              <CardHeader>
                <CardTitle>Prediction Accuracy Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Charts coming soon...
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Importance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Feature analysis coming soon...
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Recent Performance</h4>
                <p className="text-blue-800 text-sm mt-1">
                  Model accuracy has improved by 5.2% over the last 5 races, particularly for mid-field predictions.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Strong Predictions</h4>
                <p className="text-green-800 text-sm mt-1">
                  Qualifying position remains the strongest predictor (35% importance) followed by constructor form.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-900">Areas for Improvement</h4>
                <p className="text-yellow-800 text-sm mt-1">
                  Weather risk modeling needs enhancement - recent unexpected weather changes led to 3 missed predictions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictionComparisonDashboard;