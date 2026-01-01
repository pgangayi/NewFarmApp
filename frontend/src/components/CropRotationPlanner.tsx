import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFarm, useRotations, useCreateRotation } from '../api';
import { Button } from './ui/button';
import {
  RotateCcw,
  Plus,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Minus,
  Edit,
  Loader2,
} from 'lucide-react';

interface CropRotationProps {
  farmId: string;
}

const CROP_FAMILY_GROUPS = {
  Brassicas: ['cabbage', 'broccoli', 'cauliflower', 'kale'],
  Solanaceae: ['tomato', 'pepper', 'eggplant', 'potato'],
  Legumes: ['beans', 'peas', 'lentils', 'chickpeas'],
  Grains: ['corn', 'wheat', 'rice', 'barley'],
  'Root Crops': ['carrot', 'beet', 'radish', 'turnip'],
  'Leafy Greens': ['lettuce', 'spinach', 'arugula', 'kale'],
  Cucurbits: ['cucumber', 'squash', 'pumpkin', 'melon'],
};

const DISEASE_PREVENTION = {
  Brassicas: ['Avoid root crops before', 'Rotate with legumes', '3+ year rotation'],
  Solanaceae: ['Avoid other solanaceae', 'Rotate with grasses', '4+ year rotation'],
  Legumes: ['Excellent nitrogen fixers', 'Follow with heavy feeders', '2-3 year rotation'],
  Grains: ['Break disease cycles', 'Soil building crops', '2-3 year rotation'],
};

export function CropRotationPlanner({ farmId }: CropRotationProps) {
  const { data: currentFarm } = useFarm(farmId);
  const [selectedField, setSelectedField] = useState<string>('');
  const [rotationYears, setRotationYears] = useState(3);
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  const { data: rotationPlans = [], isLoading, error } = useRotations(farmId);
  const createRotationMutation = useCreateRotation();
  const isCreating = createRotationMutation.isPending;

  // Fetch fields for the farm
  const { data: fields } = useQuery({
    queryKey: ['fields', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/fields?farm_id=${farmId}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return await response.json();
    },
    enabled: !!farmId,
  });

  const handleCreateRotationPlan = (plan: any) => {
    createRotationMutation.mutate(
      {
        ...plan,
        farm_id: farmId,
        field_id: selectedField,
        status: 'active',
      },
      {
        onSuccess: () => setIsAddingPlan(false),
      }
    );
  };

  const getCropFamily = (cropType: string) => {
    for (const [family, crops] of Object.entries(CROP_FAMILY_GROUPS)) {
      if (crops.includes(cropType.toLowerCase())) {
        return family;
      }
    }
    return 'Other';
  };

  const checkRotationHealth = (sequence: any[]) => {
    const issues = [];
    const recommendations = [];

    // Check for crop family repetition
    const cropFamilies = sequence.map((crop: any) => getCropFamily(crop.crop_type));
    const familyCounts = cropFamilies.reduce(
      (acc, family) => {
        acc[family] = (acc[family] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Flag families repeated within 3 years
    for (const [family, count] of Object.entries(familyCounts)) {
      if (count > 1 && family !== 'Other') {
        issues.push(`${family} crops repeated within rotation period`);
        if (DISEASE_PREVENTION[family as keyof typeof DISEASE_PREVENTION]) {
          recommendations.push(...DISEASE_PREVENTION[family as keyof typeof DISEASE_PREVENTION]);
        }
      }
    }

    // Check for legumes
    const hasLegumes = sequence.some((crop: any) => getCropFamily(crop.crop_type) === 'Legumes');
    if (!hasLegumes) {
      recommendations.push('Consider including legumes to improve soil nitrogen');
    }

    // Check for grain breaks
    const hasGrains = sequence.some((crop: any) => getCropFamily(crop.crop_type) === 'Grains');
    if (!hasGrains) {
      recommendations.push('Include grains to break disease cycles');
    }

    return { issues, recommendations };
  };

  const generateRotationSuggestions = (years: number) => {
    const suggestions = [];
    const commonRotations = [
      ['corn', 'beans', 'wheat'],
      ['tomato', 'beans', 'wheat'],
      ['cabbage', 'beans', 'carrot'],
      ['potato', 'peas', 'corn'],
    ];

    const randomRotation = commonRotations[Math.floor(Math.random() * commonRotations.length)];

    const currentYear = new Date().getFullYear();
    for (let i = 0; i < years; i++) {
      suggestions.push({
        year: currentYear + i,
        crop_type: randomRotation[i % randomRotation.length],
        planting_date: `${currentYear + i}-03-01`,
        harvest_date: `${currentYear + i}-09-01`,
        status: 'planned' as const,
      });
    }

    return suggestions;
  };

  const handleCreatePlan = () => {
    if (!selectedField) return;

    const plan = {
      farm_id: farmId,
      field_id: selectedField,
      crop_sequence: generateRotationSuggestions(rotationYears),
      notes: `Generated ${rotationYears}-year rotation plan`,
    };

    handleCreateRotationPlan(plan);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading rotation plans...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Error loading rotation plans: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Crop Rotation Planning</h3>
          </div>
          <Button onClick={() => setIsAddingPlan(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            New Rotation Plan
          </Button>
        </div>

        <p className="text-gray-600 text-sm">
          Plan crop rotations to maintain soil health, prevent diseases, and optimize yields.
          {currentFarm && ` • ${currentFarm.name}`}
        </p>
      </div>

      {/* Add Rotation Plan Form */}
      {isAddingPlan && (
        <div className="border rounded-lg p-6 bg-white shadow">
          <h4 className="font-medium mb-4">Create New Rotation Plan</h4>

          {isCreating && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-blue-700">Creating rotation plan...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Field</label>
              <select
                value={selectedField}
                onChange={e => setSelectedField(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isCreating}
              >
                <option value="">Choose a field...</option>
                {fields?.map((field: any) => (
                  <option key={field?.id || Math.random()} value={field?.id}>
                    {field?.name || 'Unnamed Field'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rotation Period (Years)</label>
              <select
                value={rotationYears}
                onChange={e => setRotationYears(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
                disabled={isCreating}
              >
                <option value={2}>2 years</option>
                <option value={3}>3 years</option>
                <option value={4}>4 years</option>
                <option value={5}>5 years</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 rounded p-4 mb-4">
            <h5 className="font-medium text-blue-800 mb-2">Suggested Rotation</h5>
            <div className="space-y-1 text-sm text-blue-700">
              {generateRotationSuggestions(rotationYears).map((crop, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Year {index + 1}: {crop.crop_type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddingPlan(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={!selectedField || isCreating}>
              {isCreating ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </div>
      )}

      {/* Existing Rotation Plans */}
      {rotationPlans.length === 0 ? (
        <div className="border rounded-lg p-8 bg-white shadow text-center">
          <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Rotation Plans</h3>
          <p className="text-gray-600 mb-4">
            Create your first crop rotation plan to maintain soil health and optimize yields.
          </p>
          <Button onClick={() => setIsAddingPlan(true)}>Create First Plan</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rotationPlans.map((plan: any) => {
            const healthCheck = checkRotationHealth(plan.crop_sequence);
            const hasIssues = healthCheck.issues.length > 0;
            const hasRecommendations = healthCheck.recommendations.length > 0;

            return (
              <div key={plan.id} className="border rounded-lg p-6 bg-white shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-lg">{plan.field_name}</h4>
                    <p className="text-sm text-gray-600">
                      {plan.crop_sequence.length}-year rotation plan
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasIssues && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Rotation Issues</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log('Edit rotation plan', plan.id)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Rotation Sequence */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {plan.crop_sequence.map((crop: any, index: number) => {
                    const family = getCropFamily(crop.crop_type);
                    return (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Year {crop.year}</span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              crop.status === 'harvested'
                                ? 'bg-green-500'
                                : crop.status === 'planted'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                            }`}
                          ></div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium capitalize">{crop.crop_type}</div>
                          {crop.variety && <div className="text-gray-600">{crop.variety}</div>}
                          <div className="text-xs text-gray-500">{family}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Health Check Results */}
                {(hasIssues || hasRecommendations) && (
                  <div className="bg-gray-50 rounded p-4">
                    <h5 className="font-medium mb-2">Rotation Health Check</h5>

                    {hasIssues && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-700">Issues Found</span>
                        </div>
                        <ul className="text-sm text-red-600 space-y-1">
                          {healthCheck.issues.map((issue, index) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasRecommendations && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-700">Recommendations</span>
                        </div>
                        <ul className="text-sm text-green-600 space-y-1">
                          {healthCheck.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!hasIssues && !hasRecommendations && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Excellent rotation plan!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Best Practices Guide */}
      <div className="border rounded-lg p-6 bg-white shadow">
        <h4 className="font-medium mb-4">Crop Rotation Best Practices</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium mb-2">Basic Principles</h5>
            <ul className="text-sm space-y-1">
              <li>• Avoid growing the same crop family in consecutive years</li>
              <li>• Alternate deep and shallow-rooted crops</li>
              <li>• Include nitrogen-fixing legumes</li>
              <li>• Plan for 3-4 year rotation cycles</li>
              <li>• Consider soil health and disease prevention</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">Benefits</h5>
            <ul className="text-sm space-y-1">
              <li>• Improved soil fertility and structure</li>
              <li>• Reduced pest and disease buildup</li>
              <li>• Better weed management</li>
              <li>• Optimized nutrient cycling</li>
              <li>• Increased yield stability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CropRotationPlanner;
