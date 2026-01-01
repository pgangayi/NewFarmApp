import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFarm, usePestDisease, useCreatePestDisease } from '../api';
import { Button } from './ui/button';
import {
  Bug,
  Shield,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  TrendingUp,
  Loader2,
  Plus,
  Eye,
  Clock,
} from 'lucide-react';

interface PestDiseaseManagerProps {
  farmId: string;
}

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS = {
  active: 'bg-red-100 text-red-800',
  treating: 'bg-blue-100 text-blue-800',
  controlled: 'bg-green-100 text-green-800',
  resolved: 'bg-gray-100 text-gray-800',
  monitoring: 'bg-yellow-100 text-yellow-800',
};

export function PestDiseaseManager({ farmId }: PestDiseaseManagerProps) {
  const { data: currentFarm } = useFarm(farmId);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'outbreaks' | 'prevention'>(
    'overview'
  );

  const { data: records = [], isLoading, error } = usePestDisease(farmId);
  const pestIssues = records.filter(r => r.type === 'pest');
  const diseaseOutbreaks = records.filter(r => r.type === 'disease');

  // Additional queries for specific features
  const preventionTasks: any[] = []; // Placeholder
  const riskAssessment: any = { risk_level: 'low', factors: [] }; // Placeholder

  const handleCreateIssue = () => {
    // Create a new pest issue - user will fill in the form
    console.log('Opening pest issue creation form for farm:', farmId);
    // In a real implementation, this would open a modal or navigate to a form
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading pest and disease data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Error loading pest and disease data: {error.message}
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
            <Bug className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Pest & Disease Management</h3>
          </div>
          <Button onClick={handleCreateIssue}>
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </div>
        <p className="text-gray-600 text-sm">
          Monitor and manage pest issues and disease outbreaks to protect crop health.
          {currentFarm && ` • ${currentFarm.name}`}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: TrendingUp },
              { key: 'issues', label: 'Pest Issues', icon: Bug },
              { key: 'outbreaks', label: 'Disease Outbreaks', icon: Shield },
              { key: 'prevention', label: 'Prevention', icon: Calendar },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setActiveTab(key as 'overview' | 'issues' | 'outbreaks' | 'prevention')
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                  activeTab === key
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Risk Assessment Summary */}
              {riskAssessment && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Overall Risk</span>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        riskAssessment.risk_assessment?.overall_risk === 'high'
                          ? 'text-red-600'
                          : riskAssessment.risk_assessment?.overall_risk === 'medium'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {riskAssessment.risk_assessment?.overall_risk || 'Low'}
                    </p>
                    <p className="text-sm text-gray-600">Current level</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bug className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Active Issues</span>
                    </div>
                    <p className="text-2xl font-bold">{pestIssues.length}</p>
                    <p className="text-sm text-gray-600">Pest issues</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Disease Outbreaks</span>
                    </div>
                    <p className="text-2xl font-bold">{diseaseOutbreaks.length}</p>
                    <p className="text-sm text-gray-600">Active outbreaks</p>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Recent Activity</h4>
                <div className="space-y-3">
                  {pestIssues.slice(0, 3).map((issue: any) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Bug className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium">{issue.pest_name}</p>
                          <p className="text-sm text-gray-600">
                            {issue.crop_type} • {issue.field_name}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${SEVERITY_COLORS[issue.severity]}`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                  ))}

                  {pestIssues.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No recent issues reported</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-4">
              {pestIssues.length === 0 ? (
                <div className="text-center py-8">
                  <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pest Issues</h3>
                  <p className="text-gray-600 mb-4">
                    Great! No pest issues have been reported for this farm.
                  </p>
                  <Button onClick={handleCreateIssue}>
                    <Plus className="h-4 w-4 mr-2" />
                    Report Issue
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pestIssues.map((issue: any) => (
                    <div key={issue.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg">{issue.pest_name}</h4>
                          <p className="text-sm text-gray-600">
                            {issue.crop_type} • {issue.field_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${SEVERITY_COLORS[issue.severity]}`}
                          >
                            {issue.severity}
                          </span>
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[issue.status]}`}
                          >
                            {issue.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-600">Affected Area:</span>
                          <p className="font-medium">{issue.affected_area_percent}%</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Discovery Date:</span>
                          <p className="font-medium">
                            {new Date(issue.discovery_date).toLocaleDateString()}
                          </p>
                        </div>
                        {issue.treatment_applied && (
                          <div>
                            <span className="text-sm text-gray-600">Treatment:</span>
                            <p className="font-medium">{issue.treatment_applied}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded p-3 mb-4">
                        <p className="text-sm text-gray-700">{issue.description}</p>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Update Status
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'outbreaks' && (
            <div className="space-y-4">
              {diseaseOutbreaks.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Disease Outbreaks</h3>
                  <p className="text-gray-600">
                    All crops are healthy with no active disease outbreaks.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {diseaseOutbreaks.map((outbreak: any) => (
                    <div key={outbreak.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg">{outbreak.disease_name}</h4>
                          <p className="text-sm text-gray-600">
                            {outbreak.crop_type} • {outbreak.field_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${SEVERITY_COLORS[outbreak.severity]}`}
                          >
                            {outbreak.severity}
                          </span>
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[outbreak.status]}`}
                          >
                            {outbreak.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-600">Outbreak Date:</span>
                          <p className="font-medium">
                            {new Date(outbreak.outbreak_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Growth Stage:</span>
                          <p className="font-medium">{outbreak.growth_stage}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-700">{outbreak.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'prevention' && (
            <div className="space-y-6">
              {/* Prevention Calendar */}
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Upcoming Prevention Tasks</h4>
                {preventionTasks?.upcoming && preventionTasks.upcoming.length > 0 ? (
                  <div className="space-y-3">
                    {preventionTasks.upcoming.map((task: any) => (
                      <div
                        key={task?.id || Math.random()}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium">{task.task_name}</p>
                            <p className="text-sm text-gray-600">
                              {task.field_name} • Due{' '}
                              {new Date(task.scheduled_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No upcoming prevention tasks</p>
                  </div>
                )}
              </div>

              {/* Prevention Best Practices */}
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Prevention Best Practices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-2 text-green-700">Prevention Strategies</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Regular crop monitoring and scouting</li>
                      <li>• Implement integrated pest management (IPM)</li>
                      <li>• Use resistant crop varieties when possible</li>
                      <li>• Maintain proper spacing for air circulation</li>
                      <li>• Remove diseased plant material promptly</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2 text-blue-700">Early Detection</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Inspect crops daily during growing season</li>
                      <li>• Look for unusual spots, discoloration, or wilting</li>
                      <li>• Check undersides of leaves for pests</li>
                      <li>• Monitor soil moisture and drainage</li>
                      <li>• Keep detailed records of observations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PestDiseaseManager;
