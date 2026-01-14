import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import {
  TrendingUp,
  Activity,
  Brain,
  Target,
  Zap,
  Eye,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw,
  Download,
  Users,
  DollarSign,
  Sprout,
  Package,
  Clock,
  Wind,
  Thermometer,
  Gauge,
  Trophy,
  Shield,
  Leaf,
  Timer,
  CloudRain,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ModuleOverviewObject {
  health_status?: string;
  total_animals?: number;
  production_rate?: number;
  active_crops?: number;
  growth_stage?: string;
  net_profit?: number;
  revenue?: number;
  expenses?: number;
  tax_deductible_amount?: number;
  avg_temperature?: number;
  total_precipitation?: number;
  avg_humidity?: number;
}

interface ModuleOverviewArrayItem {
  mature_crops?: number;
}

interface ModulePerformance {
  performance_score?: number;
  overview?: ModuleOverviewObject | ModuleOverviewArrayItem[];
  yield_performance?: Array<{
    yield_efficiency?: number;
  }>;
}

interface Recommendation {
  title?: string;
  description?: string;
  impact?: string;
  suggestion?: string;
}

interface ComprehensiveAnalytics {
  summary: {
    overall_score: number;
    performance_trend: string;
    efficiency_rating: number;
    sustainability_score: number;
  };
  modules: {
    animals: ModulePerformance;
    crops: ModulePerformance;
    fields: ModulePerformance;
    inventory: ModulePerformance;
    tasks: ModulePerformance;
    finance: ModulePerformance;
    weather: ModulePerformance;
  };
  insights: any[];
  benchmarks: any;
  recommendations: Recommendation[];
  trends: any;
}

interface PredictiveAnalytics {
  yield_predictions: any;
  demand_forecasting: any;
  risk_assessment: any;
  maintenance_predictions: any;
  financial_projections: any;
  weather_impact_analysis: any;
}

export function AIAnalyticsDashboard() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFarm, setSelectedFarm] = useState<number>(1);
  const [viewMode, setViewMode] = useState<
    | 'comprehensive'
    | 'predictive'
    | 'optimization'
    | 'trends'
    | 'roi'
    | 'efficiency'
    | 'performance'
    | 'predictions'
    | 'recommendations'
  >('comprehensive');
  const [timeframe] = useState<'6months' | '12months' | '24months'>('12months');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get comprehensive analytics
  const {
    data: comprehensiveData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'comprehensive', selectedFarm, timeframe],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics-engine?farm_id=${selectedFarm}&type=comprehensive&timeframe=${timeframe}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comprehensive analytics');
      }

      return response.json() as Promise<ComprehensiveAnalytics>;
    },
    enabled: isAuthenticated(),
    refetchInterval: autoRefresh ? 60000 : false, // Auto-refresh every minute
  });

  // Get predictive analytics
  const { data: predictiveData } = useQuery({
    queryKey: ['analytics', 'predictive', selectedFarm],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics-engine?farm_id=${selectedFarm}&type=predictive`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch predictive analytics');
      }

      return response.json() as Promise<PredictiveAnalytics>;
    },
    enabled: isAuthenticated() && viewMode === 'predictive',
  });

  // Get optimization recommendations
  const { data: optimizationData } = useQuery({
    queryKey: ['analytics', 'optimization', selectedFarm],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics-engine?farm_id=${selectedFarm}&type=optimization`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch optimization data');
      }

      return response.json();
    },
    enabled: isAuthenticated() && viewMode === 'optimization',
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const response = await fetch('/api/analytics-engine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          farm_id: selectedFarm,
          analysis_type: reportType,
          parameters: { timeframe },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${reportType} report`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access analytics.</p>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI analytics...</p>
          <p className="text-sm text-gray-500">Analyzing farm data and generating insights</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading analytics</h2>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up' || trend === 'improving')
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (trend === 'down' || trend === 'declining')
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Advanced insights and optimization powered by machine learning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200">
                🤖 AI-Powered
              </Badge>
              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200">
                📊 Real-time
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
                >
                  {autoRefresh ? (
                    <Timer className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {autoRefresh ? 'Live Mode' : 'Manual'}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedFarm}
              onChange={e => setSelectedFarm(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={1}>Main Farm</option>
            </select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm border-b mb-8 rounded-lg shadow-sm">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              {
                key: 'comprehensive',
                label: 'Comprehensive',
                icon: BarChart3,
                description: 'Overall performance',
              },
              {
                key: 'predictive',
                label: 'Predictive',
                icon: Brain,
                description: 'AI predictions',
              },
              {
                key: 'optimization',
                label: 'Optimization',
                icon: Target,
                description: 'Improvement suggestions',
              },
              {
                key: 'trends',
                label: 'Trends',
                icon: TrendingUp,
                description: 'Historical patterns',
              },
              {
                key: 'roi',
                label: 'ROI Analysis',
                icon: DollarSign,
                description: 'Return on investment',
              },
              {
                key: 'efficiency',
                label: 'Efficiency',
                icon: Zap,
                description: 'Operational efficiency',
              },
            ].map(({ key, label, icon: Icon, description }) => (
              <button
                key={key}
                onClick={() =>
                  setViewMode(
                    key as
                      | 'comprehensive'
                      | 'performance'
                      | 'efficiency'
                      | 'predictions'
                      | 'recommendations'
                      | 'predictive'
                      | 'optimization'
                      | 'trends'
                      | 'roi'
                  )
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  viewMode === key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <div className="text-left">
                  <div>{label}</div>
                  <div className="text-xs text-gray-400">{description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Comprehensive Analytics Tab */}
        {viewMode === 'comprehensive' && comprehensiveData && (
          <div className="space-y-8">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Overall Score
                    </CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-3xl font-bold ${getScoreColor(comprehensiveData.summary.overall_score)}`}
                  >
                    {comprehensiveData.summary.overall_score}/100
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(comprehensiveData.summary.performance_trend)}
                    <span className="text-sm text-gray-600">
                      {comprehensiveData.summary.performance_trend}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className={`bg-gradient-to-r ${getScoreGradient(comprehensiveData.summary.overall_score)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${comprehensiveData.summary.overall_score}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Efficiency Rating
                    </CardTitle>
                    <Zap className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-3xl font-bold ${getScoreColor(comprehensiveData.summary.efficiency_rating)}`}
                  >
                    {comprehensiveData.summary.efficiency_rating}/100
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">High performance</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className={`bg-gradient-to-r ${getScoreGradient(comprehensiveData.summary.efficiency_rating)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${comprehensiveData.summary.efficiency_rating}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Sustainability
                    </CardTitle>
                    <Leaf className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-3xl font-bold ${getScoreColor(comprehensiveData.summary.sustainability_score)}`}
                  >
                    {comprehensiveData.summary.sustainability_score}/100
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Eco-friendly</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className={`bg-gradient-to-r ${getScoreGradient(comprehensiveData.summary.sustainability_score)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${comprehensiveData.summary.sustainability_score}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">AI Insights</CardTitle>
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {comprehensiveData.recommendations?.length || 0}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Active recommendations</span>
                  </div>
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs">
                      🤖 Generated by AI
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Module Performance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Animals Performance */}
              {comprehensiveData.modules.animals && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      Animal Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Performance Score</span>
                        <span className="font-medium">
                          {(comprehensiveData.modules.animals as ModulePerformance)
                            .performance_score || 0}
                          /100
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Health Status</span>
                        <span className="font-medium">
                          {(
                            (comprehensiveData.modules.animals as ModulePerformance)
                              .overview as ModuleOverviewObject
                          )?.health_status || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Animals</span>
                        <span className="font-medium">
                          {(
                            (comprehensiveData.modules.animals as ModulePerformance)
                              .overview as ModuleOverviewObject
                          )?.total_animals || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Production Rate</span>
                        <span className="font-medium">
                          {(
                            (comprehensiveData.modules.animals as ModulePerformance)
                              .overview as ModuleOverviewObject
                          )?.production_rate || 0}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Crop Performance */}
              {comprehensiveData.modules.crops && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-green-500" />
                      Crop Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Growth Score</span>
                        <span
                          className={`font-bold ${getScoreColor((comprehensiveData.modules.crops as ModulePerformance).performance_score || 0)}`}
                        >
                          {(comprehensiveData.modules.crops as ModulePerformance)
                            .performance_score || 0}
                          /100
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Mature Crops</span>
                        <span className="font-medium">
                          {(
                            (comprehensiveData.modules.crops as ModulePerformance)
                              .overview as ModuleOverviewArrayItem[]
                          )?.reduce(
                            (sum: number, c: { mature_crops?: number }) =>
                              sum + (c.mature_crops || 0),
                            0
                          ) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Yield Efficiency</span>
                        <span className="font-medium">
                          {Math.round(
                            ((
                              comprehensiveData.modules.crops as ModulePerformance
                            ).yield_performance?.reduce(
                              (sum: number, y: { yield_efficiency?: number }) =>
                                sum + (y.yield_efficiency || 0),
                              0
                            ) || 0) /
                              ((comprehensiveData.modules.crops as ModulePerformance)
                                .yield_performance?.length || 1)
                          ) || 0}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financial Performance */}
              {comprehensiveData.modules.finance && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Profitability</span>
                        <span
                          className={`font-bold ${getScoreColor((comprehensiveData.modules.finance as ModulePerformance).performance_score || 0)}`}
                        >
                          {(comprehensiveData.modules.finance as ModulePerformance)
                            .performance_score || 0}
                          /100
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Net Profit</span>
                        <span
                          className={`font-medium ${
                            ((
                              (comprehensiveData.modules.finance as ModulePerformance)
                                .overview as ModuleOverviewObject
                            )?.net_profit || 0) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          $
                          {(
                            (
                              (comprehensiveData.modules.finance as ModulePerformance)
                                .overview as ModuleOverviewObject
                            )?.net_profit || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tax Deductions</span>
                        <span className="font-medium">
                          $
                          {(
                            (
                              (comprehensiveData.modules.finance as ModulePerformance)
                                .overview as ModuleOverviewObject
                            )?.tax_deductible_amount || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Recommendations */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI Recommendations & Insights
                </CardTitle>
                <CardDescription>
                  Machine learning-powered suggestions to optimize your farm operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comprehensiveData.recommendations?.map((rec: Recommendation, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-purple-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Lightbulb className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {rec.title || 'Recommendation'}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {rec.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {rec.impact || 'Medium'} impact
                            </Badge>
                            <span className="text-xs text-blue-600">
                              💡 {rec.suggestion || 'No suggestion available'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="col-span-full text-center py-8">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        AI is analyzing your data to generate recommendations...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cross-Module Insights */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Cross-Module Intelligence
                </CardTitle>
                <CardDescription>
                  Advanced insights combining data from all farm modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Weather Impact on Operations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Thermometer className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-lg font-bold">
                        {Math.round(
                          (
                            (comprehensiveData.modules.weather as ModulePerformance)
                              ?.overview as ModuleOverviewObject
                          )?.avg_temperature || 0
                        )}
                        °C
                      </div>
                      <div className="text-sm text-gray-600">Avg Temperature</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CloudRain className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-lg font-bold">
                        {Math.round(
                          (
                            (comprehensiveData.modules.weather as ModulePerformance)
                              ?.overview as ModuleOverviewObject
                          )?.total_precipitation || 0
                        )}
                        mm
                      </div>
                      <div className="text-sm text-gray-600">Total Rainfall</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Wind className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-lg font-bold">
                        {Math.round(
                          (
                            (comprehensiveData.modules.weather as ModulePerformance)
                              ?.overview as ModuleOverviewObject
                          )?.avg_humidity || 0
                        )}
                        %
                      </div>
                      <div className="text-sm text-gray-600">Humidity</div>
                    </div>
                  </div>

                  {/* Operational Efficiency */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Package className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                      <div className="text-sm font-bold">
                        {(comprehensiveData.modules.inventory as ModulePerformance)
                          ?.performance_score || 0}
                        /100
                      </div>
                      <div className="text-xs text-gray-600">Inventory Health</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
                      <div className="text-sm font-bold">
                        {(comprehensiveData.modules.tasks as ModulePerformance)
                          ?.performance_score || 0}
                        /100
                      </div>
                      <div className="text-xs text-gray-600">Task Efficiency</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                      <div className="text-sm font-bold">
                        {(comprehensiveData.modules.fields as ModulePerformance)
                          ?.performance_score || 0}
                        /100
                      </div>
                      <div className="text-xs text-gray-600">Field Utilization</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Gauge className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                      <div className="text-sm font-bold">
                        {comprehensiveData.summary.overall_score}/100
                      </div>
                      <div className="text-xs text-gray-600">Overall Rating</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Predictive Analytics Tab */}
        {viewMode === 'predictive' && predictiveData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(predictiveData).map(([key, _value]) => (
                <Card key={key} className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-purple-600 mb-2">AI Prediction</div>
                      <p className="text-sm text-gray-600">
                        Machine learning analysis in progress...
                      </p>
                      <div className="mt-4">
                        <Badge variant="outline">🤖 AI Generated</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Optimization Tab */}
        {viewMode === 'optimization' && optimizationData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(optimizationData).map(([key, _value]) => (
                <Card
                  key={key}
                  className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-green-600 mb-2">Optimization</div>
                      <p className="text-sm text-gray-600">
                        AI-powered optimization recommendations...
                      </p>
                      <div className="mt-4">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          🎯 Optimization Ready
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Generate Report Section */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Generate AI Reports
            </CardTitle>
            <CardDescription>
              Create comprehensive reports powered by machine learning insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  type: 'comprehensive',
                  label: 'Comprehensive Report',
                  icon: BarChart3,
                  description: 'Complete farm analysis',
                },
                {
                  type: 'performance',
                  label: 'Performance Report',
                  icon: TrendingUp,
                  description: 'KPI and metrics analysis',
                },
                {
                  type: 'predictive',
                  label: 'Predictive Report',
                  icon: Brain,
                  description: 'AI forecasting',
                },
                {
                  type: 'optimization',
                  label: 'Optimization Report',
                  icon: Target,
                  description: 'Improvement recommendations',
                },
              ].map(({ type, label, icon: Icon, description }) => (
                <Button
                  key={type}
                  variant="outline"
                  onClick={() => generateReportMutation.mutate(type)}
                  disabled={generateReportMutation.isPending}
                  className="h-auto p-4 flex flex-col gap-2 hover:bg-blue-50"
                >
                  <Icon className="h-6 w-6 text-blue-500" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                </Button>
              ))}
            </div>
            {generateReportMutation.isPending && (
              <div className="flex items-center justify-center mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-blue-600">Generating AI-powered report...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AIAnalyticsDashboard;
