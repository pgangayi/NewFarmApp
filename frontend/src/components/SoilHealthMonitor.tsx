import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
// Note: useSoilHealth hook needs to be implemented or removed
import { useFarm } from '../hooks';
import { CropService } from '../services/domains/CropService';
import { FieldService } from '../services/domains/FieldService';
import { Button } from './ui/button';
import {
  TestTube,
  TrendingUp,
  // TrendingDown,
  // Minus,
  Calendar,
  // MapPin,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  Database,
  Leaf,
  // Droplets,
} from 'lucide-react';

const TEXT_GREEN_600 = 'text-green-600';
const TEXT_YELLOW_600 = 'text-yellow-600';
const TEXT_RED_600 = 'text-red-600';
const TEXT_GREEN_500 = 'text-green-500';
const TEXT_BLUE_600 = 'text-blue-600';

const NITROGEN = 'nitrogen';
const PHOSPHORUS = 'phosphorus';
const POTASSIUM = 'potassium';

const STATUS_HIGH = 'high';
const STATUS_ADEQUATE = 'adequate';
const STATUS_MODERATE = 'moderate';
const STATUS_DEFICIENT = 'deficient';
const STATUS_STABLE = 'stable';
const STATUS_IMPROVING = 'improving';

interface SoilHealthMonitorProps {
  farmId: string;
}

const SOIL_TYPE_DESCRIPTIONS = {
  sandy: { name: 'Sandy Soil', drainage: 'Good', water_retention: 'Low', fertility: 'Moderate' },
  clay: { name: 'Clay Soil', drainage: 'Poor', water_retention: 'High', fertility: 'High' },
  loam: { name: 'Loam Soil', drainage: 'Good', water_retention: 'Moderate', fertility: 'High' },
  silt: {
    name: 'Silt Soil',
    drainage: 'Moderate',
    water_retention: 'Moderate',
    fertility: 'Moderate',
  },
  peat: { name: 'Peat Soil', drainage: 'Poor', water_retention: 'High', fertility: 'High' },
};

const NUTRIENT_RANGES: Record<string, Array<{ min: number; status: string; color: string }>> = {
  [NITROGEN]: [
    { min: 40, status: STATUS_HIGH, color: TEXT_GREEN_600 },
    { min: 20, status: STATUS_ADEQUATE, color: TEXT_GREEN_500 },
    { min: 10, status: STATUS_MODERATE, color: TEXT_YELLOW_600 },
    { min: 0, status: STATUS_DEFICIENT, color: TEXT_RED_600 },
  ],
  [PHOSPHORUS]: [
    { min: 30, status: STATUS_HIGH, color: TEXT_GREEN_600 },
    { min: 15, status: STATUS_ADEQUATE, color: TEXT_GREEN_500 },
    { min: 5, status: STATUS_MODERATE, color: TEXT_YELLOW_600 },
    { min: 0, status: STATUS_DEFICIENT, color: TEXT_RED_600 },
  ],
  [POTASSIUM]: [
    { min: 200, status: STATUS_HIGH, color: TEXT_GREEN_600 },
    { min: 100, status: STATUS_ADEQUATE, color: TEXT_GREEN_500 },
    { min: 50, status: STATUS_MODERATE, color: TEXT_YELLOW_600 },
    { min: 0, status: STATUS_DEFICIENT, color: TEXT_RED_600 },
  ],
};

const getNutrientStatus = (value: number, type: string) => {
  const ranges = NUTRIENT_RANGES[type];
  if (!ranges) return { status: 'unknown', color: 'text-gray-600' };

  for (const range of ranges) {
    if (value >= range.min) return { status: range.status, color: range.color };
  }
  return { status: STATUS_DEFICIENT, color: TEXT_RED_600 };
};

const getPHStatus = (phLevel: number) => {
  if (phLevel >= 6.0 && phLevel <= 7.0) {
    return { status: 'optimal', color: TEXT_GREEN_600 };
  } else if (phLevel >= 5.5 && phLevel < 6.0) {
    return { status: 'slightly_acidic', color: TEXT_YELLOW_600 };
  } else if (phLevel > 7.0 && phLevel <= 7.5) {
    return { status: 'slightly_alkaline', color: TEXT_YELLOW_600 };
  } else {
    return { status: 'extreme', color: TEXT_RED_600 };
  }
};

const getOptimalCrops = (phLevel: number) => {
  if (phLevel >= 6.0 && phLevel <= 7.0) {
    return [
      { name: 'Tomatoes', ph_range: '6.0-7.0' },
      { name: 'Corn', ph_range: '5.8-7.0' },
      { name: 'Beans', ph_range: '6.0-7.0' },
      { name: 'Carrots', ph_range: '6.0-6.8' },
    ];
  } else if (phLevel < 6.0) {
    return [
      { name: 'Potatoes', ph_range: '5.0-6.0' },
      { name: 'Blueberries', ph_range: '4.5-5.5' },
      { name: 'Strawberries', ph_range: '5.5-6.5' },
    ];
  } else {
    return [
      { name: 'Lettuce', ph_range: '6.0-7.0' },
      { name: 'Spinach', ph_range: '6.5-7.5' },
      { name: 'Asparagus', ph_range: '7.0-8.0' },
    ];
  }
};

const SoilHealthSummaryCards = ({
  soilMetrics,
  soilTests,
}: {
  soilMetrics: any;
  soilTests: any[];
}) => {
  if (!soilMetrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TestTube className="h-5 w-5 text-blue-500" />
          <span className="font-medium">pH Balance</span>
        </div>
        <p
          className={`text-lg font-bold capitalize ${
            soilMetrics.ph_balance === 'neutral'
              ? TEXT_GREEN_600
              : soilMetrics.ph_balance === 'acidic'
                ? TEXT_RED_600
                : TEXT_BLUE_600
          }`}
        >
          {soilMetrics.ph_balance}
        </p>
        <p className="text-sm text-gray-600">{soilTests[0]?.ph_level?.toFixed(1) || 'N/A'}</p>
      </div>

      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-5 w-5 text-green-500" />
          <span className="font-medium">Nutrient Status</span>
        </div>
        <p
          className={`text-lg font-bold capitalize ${
            soilMetrics.nutrient_status === STATUS_ADEQUATE
              ? TEXT_GREEN_600
              : soilMetrics.nutrient_status === STATUS_DEFICIENT
                ? TEXT_RED_600
                : TEXT_YELLOW_600
          }`}
        >
          {soilMetrics.nutrient_status}
        </p>
        <p className="text-sm text-gray-600">Overall level</p>
      </div>

      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="h-5 w-5 text-purple-500" />
          <span className="font-medium">Organic Matter</span>
        </div>
        <p
          className={`text-lg font-bold capitalize ${
            soilMetrics.organic_matter_status === STATUS_HIGH
              ? TEXT_GREEN_600
              : soilMetrics.organic_matter_status === STATUS_MODERATE
                ? TEXT_YELLOW_600
                : TEXT_RED_600
          }`}
        >
          {soilMetrics.organic_matter_status}
        </p>
        <p className="text-sm text-gray-600">
          {soilTests[0]?.organic_matter_percent?.toFixed(1) || 'N/A'}%
        </p>
      </div>

      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          <span className="font-medium">Next Test</span>
        </div>
        <p className="text-lg font-bold">
          {soilMetrics.next_test_recommended
            ? new Date(soilMetrics.next_test_recommended).toLocaleDateString()
            : 'Due soon'}
        </p>
        <p className="text-sm text-gray-600">Recommended date</p>
      </div>
    </div>
  );
};

const SoilHealthTabs = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}) => (
  <div className="border-b border-gray-200">
    <nav className="-mb-px flex space-x-8 px-6">
      {[
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'tests', label: 'Tests', icon: TestTube },
        { key: 'analytics', label: 'Analytics', icon: TrendingUp },
        { key: 'recommendations', label: 'Recommendations', icon: CheckCircle },
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
            activeTab === key
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  </div>
);

export function SoilHealthMonitor({ farmId }: SoilHealthMonitorProps) {
  const { data: currentFarm } = useFarm(farmId);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tests' | 'analytics' | 'recommendations'
  >('overview');
  const [showNewTestForm, setShowNewTestForm] = useState(false);

  // TODO: Implement useSoilHealth hook to fetch real soil test data
  const soilTests: any[] = [];
  const isLoading = false;
  // Mock error for now, or use proper hook
  const error: Error | null = null;

  // Additional queries for specific features
  const { data: soilMetrics } = useQuery({
    queryKey: ['soil-health-metrics', farmId],
    queryFn: async () => {
      return CropService.getSoilHealthMetrics(farmId);
    },
    enabled: !!farmId,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['soil-recommendations', farmId],
    queryFn: async () => {
      return CropService.getSoilHealthRecommendations(farmId);
    },
    enabled: !!farmId,
  });

  // Fetch fields for the farm
  const { data: _fields } = useQuery({
    queryKey: ['fields', farmId],
    queryFn: async () => {
      return FieldService.getFieldsByFarm(farmId);
    },
    enabled: !!farmId,
  });

  const handleCreateTest = () => {
    setShowNewTestForm(true);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading soil health data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Error loading soil health data: {(error as any).message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Soil Health Monitor</h3>
          </div>
          <Button onClick={handleCreateTest}>
            <Plus className="h-4 w-4 mr-2" />
            Add Test Results
          </Button>
        </div>
        <p className="text-gray-600 text-sm">
          Monitor soil health, pH levels, and nutrients for optimal crop growth.
          {currentFarm && ` • ${currentFarm.name}`}
        </p>
      </div>

      {/* Soil Health Summary Cards */}
      <SoilHealthSummaryCards soilMetrics={soilMetrics} soilTests={soilTests} />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <SoilHealthTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Test Summary */}
              <div>
                <h4 className="font-medium mb-4">Recent Soil Test Summary</h4>
                {soilTests.length === 0 ? (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Soil Tests</h3>
                    <p className="text-gray-600 mb-4">
                      Start monitoring your soil health with regular testing.
                    </p>
                    <Button onClick={handleCreateTest}>Create First Test</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {soilTests.slice(0, 4).map((test: any) => {
                      const phStatus = getPHStatus(test.ph_level);
                      const nitrogenStatus = getNutrientStatus(test.nitrogen_ppm, NITROGEN);
                      const phosphorusStatus = getNutrientStatus(test.phosphorus_ppm, PHOSPHORUS);
                      const potassiumStatus = getNutrientStatus(test.potassium_ppm, POTASSIUM);

                      return (
                        <div key={test.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium">{test.field_name}</h5>
                              <p className="text-sm text-gray-600">
                                {new Date(test.test_date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-sm text-gray-600 capitalize">
                              {test.test_type}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>pH Level:</span>
                              <span className={`font-medium ${phStatus.color}`}>
                                {test.ph_level.toFixed(1)} ({phStatus.status})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Organic Matter:</span>
                              <span className="font-medium">
                                {test.organic_matter_percent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Nitrogen:</span>
                              <span className={`font-medium ${nitrogenStatus.color}`}>
                                {test.nitrogen_ppm} ppm ({nitrogenStatus.status})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Phosphorus:</span>
                              <span className={`font-medium ${phosphorusStatus.color}`}>
                                {test.phosphorus_ppm} ppm ({phosphorusStatus.status})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Potassium:</span>
                              <span className={`font-medium ${potassiumStatus.color}`}>
                                {test.potassium_ppm} ppm ({potassiumStatus.status})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Health Trends */}
              {soilTests.length > 1 && (
                <div>
                  <h4 className="font-medium mb-4">Health Trends</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">pH Trend</span>
                      </div>
                      <p
                        className={`text-lg font-bold capitalize ${
                          soilMetrics?.trends?.ph_trend === STATUS_IMPROVING
                            ? TEXT_GREEN_600
                            : soilMetrics?.trends?.ph_trend === STATUS_STABLE
                              ? TEXT_BLUE_600
                              : TEXT_RED_600
                        }`}
                      >
                        {soilMetrics?.trends?.ph_trend || STATUS_STABLE}
                      </p>
                    </div>

                    <div className="border rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Organic Matter</span>
                      </div>
                      <p
                        className={`text-lg font-bold capitalize ${
                          soilMetrics?.trends?.organic_matter_trend === STATUS_IMPROVING
                            ? TEXT_GREEN_600
                            : soilMetrics?.trends?.organic_matter_trend === STATUS_STABLE
                              ? TEXT_BLUE_600
                              : TEXT_RED_600
                        }`}
                      >
                        {soilMetrics?.trends?.organic_matter_trend || STATUS_STABLE}
                      </p>
                    </div>

                    <div className="border rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Nutrients</span>
                      </div>
                      <p
                        className={`text-lg font-bold capitalize ${
                          soilMetrics?.trends?.nutrient_trend === STATUS_IMPROVING
                            ? TEXT_GREEN_600
                            : soilMetrics?.trends?.nutrient_trend === STATUS_STABLE
                              ? TEXT_BLUE_600
                              : TEXT_RED_600
                        }`}
                      >
                        {soilMetrics?.trends?.nutrient_trend || STATUS_STABLE}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-4">
              {/* Test Results */}
              <div className="space-y-4">
                {soilTests.map((test: any) => {
                  const phStatus = getPHStatus(test.ph_level);
                  const soilType =
                    SOIL_TYPE_DESCRIPTIONS[test.soil_type as keyof typeof SOIL_TYPE_DESCRIPTIONS];
                  const optimalCrops = getOptimalCrops(test.ph_level);

                  return (
                    <div key={test.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg">{test.field_name}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(test.test_date).toLocaleDateString()} • {test.test_type}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Soil Type</div>
                          <div className="font-medium capitalize">
                            {soilType?.name || test.soil_type}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">pH Level</div>
                          <div className="text-2xl font-bold mb-1">{test.ph_level.toFixed(1)}</div>
                          <div className={`text-sm capitalize ${phStatus.color}`}>
                            {phStatus.status}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600 mb-1">Organic Matter</div>
                          <div className="text-2xl font-bold mb-1">
                            {test.organic_matter_percent.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {test.organic_matter_percent > 3 ? 'Good' : 'Needs improvement'}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600 mb-1">Nitrogen</div>
                          <div className="text-2xl font-bold mb-1">{test.nitrogen_ppm} ppm</div>
                          <div
                            className={`text-sm ${getNutrientStatus(test.nitrogen_ppm, NITROGEN).color}`}
                          >
                            {getNutrientStatus(test.nitrogen_ppm, NITROGEN).status}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600 mb-1">Phosphorus</div>
                          <div className="text-2xl font-bold mb-1">{test.phosphorus_ppm} ppm</div>
                          <div
                            className={`text-sm ${getNutrientStatus(test.phosphorus_ppm, PHOSPHORUS).color}`}
                          >
                            {getNutrientStatus(test.phosphorus_ppm, PHOSPHORUS).status}
                          </div>
                        </div>
                      </div>

                      {/* Optimal Crops */}
                      {optimalCrops.length > 0 && (
                        <div className="bg-green-50 rounded p-3 mb-4">
                          <h5 className="font-medium text-green-800 mb-2">
                            Optimal Crops for this pH
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {optimalCrops.map((crop: any) => (
                              <span
                                key={crop.name}
                                className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded"
                              >
                                {crop.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {test.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium mb-2">Notes</h5>
                          <p className="text-sm text-gray-600">{test.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* Personalized Recommendations */}
              <div>
                <h4 className="font-medium mb-4">Personalized Recommendations</h4>
                <div className="space-y-4">
                  {recommendations?.recommendations &&
                  recommendations.recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.recommendations.map((fieldRec: any) => (
                        <div
                          key={fieldRec?.field_id || Math.random()}
                          className="border rounded p-4"
                        >
                          <h5 className="font-medium mb-2">{fieldRec.field_name}</h5>
                          <div className="space-y-2">
                            {fieldRec?.recommendations?.map((rec: any, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded ${
                                  rec.priority === 'high'
                                    ? 'bg-red-50 border border-red-200'
                                    : rec.priority === 'medium'
                                      ? 'bg-yellow-50 border border-yellow-200'
                                      : 'bg-green-50 border border-green-200'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <CheckCircle
                                    className={`h-5 w-5 mt-0.5 ${
                                      rec.priority === 'high'
                                        ? 'text-red-500'
                                        : rec.priority === 'medium'
                                          ? 'text-yellow-500'
                                          : 'text-green-500'
                                    }`}
                                  />
                                  <div>
                                    <p className="font-medium">{rec.description}</p>
                                    <p className="text-sm text-gray-600">
                                      Action: {rec.action} • Timeline: {rec.timeline}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>All systems optimized!</p>
                      <p className="text-sm">No specific recommendations at this time</p>
                    </div>
                  )}
                </div>
              </div>

              {/* General Best Practices */}
              <div>
                <h4 className="font-medium mb-4">Soil Health Best Practices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded p-4">
                    <h5 className="font-medium mb-3">Regular Testing</h5>
                    <ul className="text-sm space-y-2">
                      <li>• Test soil every 2-3 years</li>
                      <li>• Test before major crop changes</li>
                      <li>• Test in multiple field locations</li>
                      <li>• Test at the same time of year for consistency</li>
                    </ul>
                  </div>

                  <div className="border rounded p-4">
                    <h5 className="font-medium mb-3">Organic Matter</h5>
                    <ul className="text-sm space-y-2">
                      <li>• Add 2-4 inches of compost annually</li>
                      <li>• Use cover crops in off-season</li>
                      <li>• Mulch around plants</li>
                      <li>• Avoid over-tilling</li>
                    </ul>
                  </div>

                  <div className="border rounded p-4">
                    <h5 className="font-medium mb-3">pH Management</h5>
                    <ul className="text-sm space-y-2">
                      <li>• Lime raises pH (acidic soils)</li>
                      <li>• Sulfur lowers pH (alkaline soils)</li>
                      <li>• Apply amendments 6 months before planting</li>
                      <li>• Retest after major amendments</li>
                    </ul>
                  </div>

                  <div className="border rounded p-4">
                    <h5 className="font-medium mb-3">Crop Rotation</h5>
                    <ul className="text-sm space-y-2">
                      <li>• Rotate crop families annually</li>
                      <li>• Follow heavy feeders with legumes</li>
                      <li>• Use different rooting depths</li>
                      <li>• Include green manure crops</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Test Form Modal */}
      {showNewTestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="font-medium mb-4">New Soil Test Results</h4>

            <div className="text-center py-8">
              <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Soil test form would be implemented here</p>
              <p className="text-sm text-gray-500 mt-2">
                This would integrate with the createSoilTest function from the hook
              </p>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowNewTestForm(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SoilHealthMonitor;
