import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/AuthContext';
import { apiEndpoints } from '../config/env';
import { BarChart, TrendingUp, DollarSign, Heart, Baby, Activity } from 'lucide-react';

interface TopPerformingAnimal {
  name: string;
  species: string;
  breed: string;
  production: number;
}

interface Species {
  species: string;
  count: number;
  percentage?: number;
}

interface AnalyticsData {
  totalAnimals: number;
  healthyAnimals: number;
  sickAnimals: number;
  totalProduction: number;
  totalRevenue: number;
  avgProductionPerAnimal: number;
  breedingSuccessRate: number;
  vaccinationCompliance: number;
  topPerformingAnimals: TopPerformingAnimal[];
  productionTrends: unknown[];
  healthOverview: unknown;
  speciesBreakdown: Species[];
  upcomingEvents: unknown[];
}

interface AnimalAnalyticsDashboardProps {
  farmId?: string;
}

export function AnimalAnalyticsDashboard({ farmId }: AnimalAnalyticsDashboardProps) {
  const { getAuthHeaders } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('production');

  const queryParams = new URLSearchParams({
    timeRange,
    farmId: farmId || '',
  });

  // Fetch analytics data
  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['animal-analytics', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`${apiEndpoints.animals.analytics}?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      return await response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-8">Error loading analytics: {error.message}</div>
    );
  }

  const data: AnalyticsData = analyticsData || {};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Animal Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into your livestock performance</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="production">Production</option>
            <option value="health">Health</option>
            <option value="breeding">Breeding</option>
            <option value="financial">Financial</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Animals</p>
              <p className="text-3xl font-bold text-blue-900">{data.totalAnimals || 0}</p>
              <p className="text-sm text-blue-600">
                {data.healthyAnimals || 0} healthy, {data.sickAnimals || 0} need attention
              </p>
            </div>
            <Activity className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Production</p>
              <p className="text-3xl font-bold text-green-900">
                {data.totalProduction ? data.totalProduction.toFixed(1) : '0'} units
              </p>
              <p className="text-sm text-green-600">
                Avg: {data.avgProductionPerAnimal ? data.avgProductionPerAnimal.toFixed(1) : '0'}{' '}
                per animal
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Revenue</p>
              <p className="text-3xl font-bold text-purple-900">
                {formatCurrency(data.totalRevenue || 0)}
              </p>
              <p className="text-sm text-purple-600">from production sales</p>
            </div>
            <DollarSign className="h-10 w-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-pink-700">Breeding Success</p>
              <p className="text-3xl font-bold text-pink-900">
                {data.breedingSuccessRate ? formatPercentage(data.breedingSuccessRate) : '0%'}
              </p>
              <p className="text-sm text-pink-600">success rate</p>
            </div>
            <Baby className="h-10 w-10 text-pink-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Production Trends</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Production trend chart</p>
              <p className="text-sm text-gray-400">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        {/* Species Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Species Distribution</h3>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {(data.speciesBreakdown as Species[])?.map((species: Species, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      index === 0
                        ? 'bg-blue-500'
                        : index === 1
                          ? 'bg-green-500'
                          : index === 2
                            ? 'bg-yellow-500'
                            : 'bg-purple-500'
                    }`}
                  ></div>
                  <span className="text-gray-700 capitalize">{species.species}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900">{species.count}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({species.percentage ? formatPercentage(species.percentage) : '0%'})
                  </span>
                </div>
              </div>
            )) || <div className="text-center py-8 text-gray-500">No species data available</div>}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Animals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-3">
            {(data.topPerformingAnimals as TopPerformingAnimal[])?.map(
              (animal: TopPerformingAnimal, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{animal.name}</p>
                    <p className="text-sm text-gray-500">
                      {animal.species} • {animal.breed}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {animal.production ? animal.production.toFixed(1) : '0'} units
                    </p>
                    <p className="text-sm text-gray-500">this month</p>
                  </div>
                </div>
              )
            ) || (
              <div className="text-center py-4 text-gray-500">No performance data available</div>
            )}
          </div>
        </div>

        {/* Health Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Health Overview</h3>
            <Heart className="h-5 w-5 text-red-600" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Vaccination Compliance</span>
              <span className="font-medium text-green-600">
                {data.vaccinationCompliance ? formatPercentage(data.vaccinationCompliance) : '0%'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Animals Needing Attention</span>
              <span className="font-medium text-red-600">{data.sickAnimals || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Upcoming Vet Visits</span>
              <span className="font-medium text-blue-600">
                {data.upcomingEvents?.filter((e: unknown) => e.type === 'vet_visit').length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Vaccinations Due</span>
              <span className="font-medium text-orange-600">
                {data.upcomingEvents?.filter((e: unknown) => e.type === 'vaccination').length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Schedule Vet Visit</p>
                  <p className="text-sm text-gray-500">Book appointments for sick animals</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Record Production</p>
                  <p className="text-sm text-gray-500">Enter today&apos;s production data</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Baby className="h-5 w-5 text-pink-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Breeding</p>
                  <p className="text-sm text-gray-500">Update breeding records</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Generate Report</p>
                  <p className="text-sm text-gray-500">Export analytics data</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      {data.upcomingEvents && data.upcomingEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {data.upcomingEvents.slice(0, 5).map((event: unknown, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200"
              >
                <div className="flex items-center gap-3">
                  {event.type === 'vet_visit' && <Heart className="h-5 w-5 text-red-600" />}
                  {event.type === 'vaccination' && <Activity className="h-5 w-5 text-blue-600" />}
                  {event.type === 'breeding' && <Baby className="h-5 w-5 text-pink-600" />}
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">{event.animalName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(event.dueDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{event.type.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
