import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFarm } from '../hooks/useFarm';
import { Button } from './ui/button';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  Plus,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface CropPlanningProps {
  farmId: string;
}

export function CropPlanning({ farmId }: CropPlanningProps) {
  const { currentFarm } = useFarm();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Fetch existing plans
  const {
    data: plans = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['crop-plans', farmId],
    queryFn: async () => {
      const response = await fetch('/api/crops/planning', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if needed
        },
      });
      if (!response.ok) throw new Error('Failed to fetch crop plans');
      return await response.json();
    },
    enabled: !!farmId,
  });

  // Fetch fields for planning
  const { data: fields } = useQuery({
    queryKey: ['fields', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/fields?farm_id=${farmId}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return await response.json();
    },
    enabled: !!farmId,
  });

  const handleCreatePlan = async (planData: any) => {
    try {
      const response = await fetch('/api/crops/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) throw new Error('Failed to create plan');

      const result = await response.json();
      setShowCreateForm(false);
      refetch();
      return result;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading crop plans...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Error loading crop plans: {error.message}
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
            <Calculator className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Crop Planning & Financial Projections</h3>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
        <p className="text-gray-600 text-sm">
          Create financial projections for crop planting with cost analysis and profit estimates.
          {currentFarm && ` • ${currentFarm.name}`}
        </p>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="border rounded-lg p-8 bg-white shadow text-center">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Crop Plans Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first financial plan to project costs, revenue, and profitability for crop
            planting.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan: any) => (
            <div key={plan.id} className="border rounded-lg p-6 bg-white shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-lg">{plan.plan_name}</h4>
                  <p className="text-sm text-gray-600">
                    {plan.crop_type} • {plan.field_name}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      plan.projected_profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${plan.projected_profit?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-gray-500">Projected Profit</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Cost</div>
                  <div className="font-medium">${plan.projected_cost?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Revenue</div>
                  <div className="font-medium">${plan.projected_revenue?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">ROI</div>
                  <div className="font-medium">
                    {plan.projected_cost > 0
                      ? `${((plan.projected_profit / plan.projected_cost) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Planting: {new Date(plan.planting_date).toLocaleDateString()}</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedPlan(plan.id)}>
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Crop Financial Plan</h2>

              <PlanCreationForm
                fields={fields || []}
                onSubmit={handleCreatePlan}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Plan Details</h2>
                <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                  Close
                </Button>
              </div>

              <PlanDetails plan={plans.find((p: any) => p.id === selectedPlan)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Plan Creation Form Component
function PlanCreationForm({ fields, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    plan_name: '',
    field_id: '',
    crop_type: '',
    planting_date: new Date().toISOString().split('T')[0],
    expected_yield_unit: '',
    expected_price_unit: '',
    activities: [] as any[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting plan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          activity_type: '',
          cost_per_unit: '',
          units_used_per_sqm: '',
        },
      ],
    }));
  };

  const updateActivity = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map((activity, i) =>
        i === index ? { ...activity, [field]: value } : activity
      ),
    }));
  };

  const removeActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
          <input
            type="text"
            required
            value={formData.plan_name}
            onChange={e => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., Spring Corn 2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field *</label>
          <select
            required
            value={formData.field_id}
            onChange={e => setFormData(prev => ({ ...prev, field_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select field...</option>
            {fields.map((field: any) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
          <input
            type="text"
            required
            value={formData.crop_type}
            onChange={e => setFormData(prev => ({ ...prev, crop_type: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., Corn, Wheat, Soybeans"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date *</label>
          <input
            type="date"
            required
            value={formData.planting_date}
            onChange={e => setFormData(prev => ({ ...prev, planting_date: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Yield (per sqm) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.expected_yield_unit}
            onChange={e => setFormData(prev => ({ ...prev, expected_yield_unit: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., 0.5 kg/sqm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Price (per unit) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.expected_price_unit}
            onChange={e => setFormData(prev => ({ ...prev, expected_price_unit: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., $0.15/kg"
          />
        </div>
      </div>

      {/* Activities Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Planned Activities & Costs</h3>
          <Button type="button" variant="outline" size="sm" onClick={addActivity}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>

        {formData.activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Add activities to calculate costs and projections</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.activities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Activity type (e.g., Fertilizer, Irrigation)"
                    value={activity.activity_type}
                    onChange={e => updateActivity(index, 'activity_type', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Cost/unit"
                    value={activity.cost_per_unit}
                    onChange={e => updateActivity(index, 'cost_per_unit', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Units/sqm"
                    value={activity.units_used_per_sqm}
                    onChange={e => updateActivity(index, 'units_used_per_sqm', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeActivity(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || formData.activities.length === 0}>
          {isSubmitting ? 'Creating...' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
}

// Plan Details Component
function PlanDetails({ plan }: any) {
  if (!plan) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-red-500" />
            <span className="font-medium">Total Cost</span>
          </div>
          <p className="text-2xl font-bold">${plan.projected_cost?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="font-medium">Revenue</span>
          </div>
          <p className="text-2xl font-bold">${plan.projected_revenue?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Profit</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              plan.projected_profit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ${plan.projected_profit?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <span className="font-medium">ROI</span>
          </div>
          <p className="text-2xl font-bold">
            {plan.projected_cost > 0
              ? `${((plan.projected_profit / plan.projected_cost) * 100).toFixed(1)}%`
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Plan Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Plan Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan Name:</span>
              <span className="font-medium">{plan.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Crop Type:</span>
              <span className="font-medium">{plan.crop_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Field:</span>
              <span className="font-medium">{plan.field_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Planting Date:</span>
              <span className="font-medium">
                {new Date(plan.planting_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Yield:</span>
              <span className="font-medium">{plan.expected_yield_unit} units/sqm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Price:</span>
              <span className="font-medium">${plan.expected_price_unit}/unit</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Activities Breakdown</h4>
          {plan.activities && plan.activities.length > 0 ? (
            <div className="space-y-2">
              {plan.activities.map((activity: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{activity.activity_type}:</span>
                  <span className="font-medium">
                    ${activity.total_projected_cost?.toFixed(2) || '0.00'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No activities recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CropPlanning;
