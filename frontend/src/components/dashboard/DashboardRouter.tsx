// Unified Dashboard Router
// Consolidates all dashboard components with feature flag support

import React, { useState } from 'react';
import { featureFlags } from '../../config/featureFlags';
import { AdvancedManagementDashboard } from '../AdvancedManagementDashboard';
import { AIAnalyticsDashboard } from '../AIAnalyticsDashboard';
import { AnimalAnalyticsDashboard } from '../AnimalAnalyticsDashboard';
import { Button } from '../ui/button';
import { BarChart3, Brain, Gauge, TrendingUp, Activity, Settings, Loader2 } from 'lucide-react';

interface DashboardRouterProps {
  farmId: string;
  className?: string;
}

type DashboardView = 'overview' | 'advanced' | 'ai' | 'animals';

interface DashboardConfig {
  key: DashboardView;
  label: string;
  icon: React.ComponentType<unknown>;
  component: React.ComponentType<unknown>;
  featureFlag?: keyof typeof featureFlags;
  description: string;
}

const DASHBOARD_CONFIGS: DashboardConfig[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: BarChart3,
    component: AdvancedManagementDashboard,
    description: 'System overview and management dashboard',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    icon: TrendingUp,
    component: AdvancedManagementDashboard,
    featureFlag: 'enableAdvancedDashboard',
    description: 'Advanced management features and insights',
  },
  {
    key: 'ai',
    label: 'AI Analytics',
    icon: Brain,
    component: AIAnalyticsDashboard,
    featureFlag: 'enableAIAnalytics',
    description: 'AI-powered analytics and predictions',
  },
  {
    key: 'animals',
    label: 'Animals',
    icon: Activity,
    component: AnimalAnalyticsDashboard,
    featureFlag: 'enableAnimalAnalytics',
    description: 'Animal health and productivity analytics',
  },
];

export function DashboardRouter({ farmId, className = '' }: DashboardRouterProps) {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Filter dashboards based on feature flags
  const availableDashboards = DASHBOARD_CONFIGS.filter(config => {
    if (!config.featureFlag) return true;
    return featureFlags[config.featureFlag];
  });

  const handleViewChange = (view: DashboardView) => {
    if (view === activeView) return;

    setIsLoading(true);
    setActiveView(view);

    // Simulate loading time for smooth transitions
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const activeConfig = DASHBOARD_CONFIGS.find(config => config.key === activeView);
  const ActiveComponent = activeConfig?.component;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Farm Dashboards</h2>
          </div>

          {featureFlags.enableAdvancedDashboard && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availableDashboards.map(config => {
            const Icon = config.icon;
            const isActive = activeView === config.key;

            return (
              <Button
                key={config.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange(config.key)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {activeConfig && (
          <div className="mt-3 text-sm text-gray-600">{activeConfig.description}</div>
        )}
      </div>

      {/* Dashboard Content */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        )}

        <div
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        >
          {ActiveComponent && (
            <ActiveComponent
              farmId={farmId}
              key={activeView} // Force re-render when switching views
            />
          )}
        </div>
      </div>

      {/* Dashboard Stats Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">Dashboard Summary</h3>
            <p className="text-sm text-blue-700">
              {availableDashboards.length} dashboard{availableDashboards.length !== 1 ? 's' : ''}{' '}
              available
              {activeConfig && ` • Currently viewing: ${activeConfig.label}`}
            </p>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-blue-900">
              {featureFlags.enableAIAnalytics && featureFlags.enableAdvancedDashboard
                ? 'Pro'
                : 'Standard'}
            </div>
            <div className="text-xs text-blue-600">Plan Level</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardRouter;
