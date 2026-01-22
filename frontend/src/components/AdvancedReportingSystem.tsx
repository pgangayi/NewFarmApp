import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  // Filter,
  // Calendar,
  BarChart3,
  // PieChart,
  // LineChart,
  TrendingUp,
  // Users,
  DollarSign,
  // Package,
  // Sprout,
  Activity,
  Clock,
  Target,
  // Award,
  Eye,
  Settings,
  RefreshCw,
  Share,
  // Printer,
  // Mail,
  // Calendar as CalendarIcon,
  // FileSpreadsheet,
  // FileImage,
  CheckCircle,
  // AlertTriangle,
  // Info,
  // Zap,
  // Star,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';

const CATEGORY_OPERATIONAL = 'operational';
const CATEGORY_FINANCIAL = 'financial';
const CATEGORY_COMPLIANCE = 'compliance';
const CATEGORY_PERFORMANCE = 'performance';
const CATEGORY_CUSTOM = 'custom';

const TYPE_PDF = 'pdf';
const TYPE_EXCEL = 'excel';
const TYPE_CSV = 'csv';

const FREQ_MONTHLY = 'monthly';
const FREQ_WEEKLY = 'weekly';
const FREQ_QUARTERLY = 'quarterly';
const FREQ_ON_DEMAND = 'on_demand';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'performance' | 'compliance' | 'custom';
  type: 'pdf' | 'excel' | 'csv' | 'json';
  frequency: 'on_demand' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  estimated_time: string;
  sections: string[];
  preview_available: boolean;
  download_count: number;
  last_generated?: string;
}

interface ReportData {
  financial_summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    top_income_sources: { source: string; amount: number; percentage: number }[];
    major_expenses: { category: string; amount: number; percentage: number }[];
  };
  operational_metrics: {
    total_crops: number;
    active_fields: number;
    total_animals: number;
    inventory_items: number;
    pending_tasks: number;
    completed_tasks: number;
  };
  performance_indicators: {
    crop_yield_efficiency: number;
    animal_health_score: number;
    inventory_turnover: number;
    task_completion_rate: number;
    overall_efficiency: number;
  };
  trends: {
    revenue_trend: 'up' | 'down' | 'stable';
    expense_trend: 'up' | 'down' | 'stable';
    productivity_trend: 'up' | 'down' | 'stable';
    efficiency_trend: 'up' | 'down' | 'stable';
  };
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'financial-overview',
    name: 'Financial Overview Report',
    description:
      'Comprehensive financial analysis with profit/loss, cash flow, and budget performance',
    category: CATEGORY_FINANCIAL,
    type: TYPE_PDF,
    frequency: FREQ_MONTHLY,
    estimated_time: '2-3 minutes',
    sections: [
      'Executive Summary',
      'Revenue Analysis',
      'Expense Breakdown',
      'Cash Flow',
      'Budget Performance',
      'Recommendations',
    ],
    preview_available: true,
    download_count: 45,
    last_generated: '2024-11-01',
  },
  {
    id: 'operational-performance',
    name: 'Operational Performance Report',
    description:
      'Detailed operational metrics including crop yields, animal health, and task efficiency',
    category: CATEGORY_OPERATIONAL,
    type: TYPE_EXCEL,
    frequency: FREQ_WEEKLY,
    estimated_time: '3-5 minutes',
    sections: [
      'Performance Overview',
      'Crop Management',
      'Animal Care',
      'Task Efficiency',
      'Resource Utilization',
    ],
    preview_available: true,
    download_count: 32,
    last_generated: '2024-11-05',
  },
  {
    id: 'compliance-audit',
    name: 'Compliance & Audit Report',
    description: 'Regulatory compliance tracking and audit trail documentation',
    category: CATEGORY_COMPLIANCE,
    type: TYPE_PDF,
    frequency: FREQ_QUARTERLY,
    estimated_time: '5-7 minutes',
    sections: [
      'Compliance Status',
      'Regulatory Requirements',
      'Audit Trail',
      'Documentation Review',
      'Action Items',
    ],
    preview_available: false,
    download_count: 18,
    last_generated: '2024-10-15',
  },
  {
    id: 'custom-dashboard',
    name: 'Custom Dashboard Report',
    description:
      'Tailored report with custom metrics and visualizations based on your specifications',
    category: CATEGORY_CUSTOM,
    type: TYPE_PDF,
    frequency: FREQ_ON_DEMAND,
    estimated_time: '1-2 minutes',
    sections: ['Custom Metrics', 'Data Visualization', 'Key Insights', 'Action Recommendations'],
    preview_available: true,
    download_count: 67,
    last_generated: '2024-11-03',
  },
  {
    id: 'inventory-analysis',
    name: 'Inventory Analysis Report',
    description:
      'Comprehensive inventory management with stock levels, turnover rates, and optimization suggestions',
    category: CATEGORY_OPERATIONAL,
    type: TYPE_EXCEL,
    frequency: FREQ_MONTHLY,
    estimated_time: '2-4 minutes',
    sections: [
      'Inventory Overview',
      'Stock Levels',
      'Turnover Analysis',
      'Cost Analysis',
      'Optimization Opportunities',
    ],
    preview_available: true,
    download_count: 29,
    last_generated: '2024-11-02',
  },
  {
    id: 'yield-prediction',
    name: 'Yield Prediction Report',
    description:
      'AI-powered yield forecasting with historical analysis and improvement recommendations',
    category: 'performance',
    type: 'pdf',
    frequency: 'monthly',
    estimated_time: '4-6 minutes',
    sections: [
      'Yield Forecasts',
      'Historical Analysis',
      'Weather Impact',
      'Optimization Strategies',
      'Risk Assessment',
    ],
    preview_available: true,
    download_count: 41,
    last_generated: '2024-11-01',
  },
];

export default function AdvancedReportingSystem() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  useEffect(() => {
    // NOTE: Replace with actual API call when backend is ready
    // const fetchReportData = async () => {
    //   const data = await apiClient.get('/api/reports/data');
    //   setReportData(data);
    // };

    // For now, using mock data for development
    const mockData: ReportData = {
      financial_summary: {
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        profit_margin: 0,
        top_income_sources: [],
        major_expenses: [],
      },
      operational_metrics: {
        total_crops: 0,
        active_fields: 0,
        total_animals: 0,
        inventory_items: 0,
        pending_tasks: 0,
        completed_tasks: 0,
      },
      performance_indicators: {
        crop_yield_efficiency: 0,
        animal_health_score: 0,
        inventory_turnover: 0,
        task_completion_rate: 0,
        overall_efficiency: 0,
      },
      trends: {
        revenue_trend: 'stable',
        expense_trend: 'stable',
        productivity_trend: 'stable',
        efficiency_trend: 'stable',
      },
    };
    setReportData(mockData);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return DollarSign;
      case CATEGORY_OPERATIONAL:
        return Activity;
      case 'performance':
        return TrendingUp;
      case 'compliance':
        return CheckCircle;
      case 'custom':
        return Settings;
      default:
        return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial':
        return 'text-green-600 bg-green-100';
      case CATEGORY_OPERATIONAL:
        return 'text-blue-600 bg-blue-100';
      case 'performance':
        return 'text-purple-600 bg-purple-100';
      case 'compliance':
        return 'text-orange-600 bg-orange-100';
      case 'custom':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const generateReport = async (templateId: string) => {
    setLoading(true);
    setSelectedTemplate(templateId);

    try {
      // NOTE: Replace with actual API call when backend is ready
      // const response = await apiClient.post('/api/reports/generate', { templateId });
      // if (response.success) {
      //   toast({ title: 'Success', description: 'Report generated successfully' });
      // }

      // For now, showing placeholder message
      toast({
        title: 'Coming Soon',
        description: 'Report generation will be available in the next update.',
      });
      console.log(
        `Report "${reportTemplates.find((t: any) => t.id === templateId)?.name}" generation initiated.`
      );
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (templateId: string, format: string) => {
    // In a real implementation, this would download the actual report
    const template = reportTemplates.find(t => t.id === templateId);
    alert(`Downloading ${template?.name} as ${format.toUpperCase()} file...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Advanced Reporting System</h1>
                <p className="text-gray-600 mt-1">Generate comprehensive reports and analytics</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => setActiveTab('generate')}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm border-b mb-8 rounded-lg shadow-sm">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'templates', label: 'Report Templates', icon: FileText },
              { key: 'generate', label: 'Generate Reports', icon: Download },
              { key: 'history', label: 'Report History', icon: Clock },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setActiveTab(key as 'templates' | 'generate' | 'history' | 'analytics')
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
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

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Available Report Templates</h2>
              <div className="flex items-center space-x-4">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Search templates..." className="w-64" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportTemplates.map(template => {
                const IconComponent = getCategoryIcon(template.category);
                return (
                  <Card
                    key={template.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription className="text-sm text-gray-600">
                              {template.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Format:</span>
                            <span className="ml-2 font-medium">{template.type.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Frequency:</span>
                            <span className="ml-2 font-medium">
                              {template.frequency.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Time:</span>
                            <span className="ml-2 font-medium">{template.estimated_time}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Downloads:</span>
                            <span className="ml-2 font-medium">{template.download_count}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-600">Sections:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.sections.slice(0, 3).map((section, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {section}
                              </Badge>
                            ))}
                            {template.sections.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.sections.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2">
                            {template.preview_available && (
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateReport(template.id)}
                              disabled={loading && selectedTemplate === template.id}
                            >
                              {loading && selectedTemplate === template.id ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  Generate
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Select
                              defaultValue="pdf"
                              onValueChange={value =>
                                downloadReport(template.id, value as 'pdf' | 'excel' | 'csv')
                              }
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="excel">Excel</SelectItem>
                                <SelectItem value="csv">CSV</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {template.last_generated && (
                          <p className="text-xs text-gray-500">
                            Last generated: {template.last_generated}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Generate Reports Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Custom Report Generator
                </CardTitle>
                <CardDescription>
                  Create customized reports with your preferred parameters and format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="report-template"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Report Template
                      </label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger id="report-template">
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="block text-sm font-medium text-gray-700 mb-2">Date Range</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          aria-label="Start Date"
                          value={dateRange.start}
                          onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <Input
                          type="date"
                          aria-label="End Date"
                          value={dateRange.end}
                          onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="output-format"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Output Format
                      </label>
                      <Select
                        value={format}
                        onValueChange={value => setFormat(value as 'pdf' | 'excel' | 'csv')}
                      >
                        <SelectTrigger id="output-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                          <SelectItem value="csv">CSV Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Options
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="include-charts"
                            className="mr-2"
                            defaultChecked
                          />
                          <label htmlFor="include-charts" className="text-sm">
                            Include charts and visualizations
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="add-summary" className="mr-2" defaultChecked />
                          <label htmlFor="add-summary" className="text-sm">
                            Add executive summary
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="include-raw-data" className="mr-2" />
                          <label htmlFor="include-raw-data" className="text-sm">
                            Include raw data appendix
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="email-report" className="mr-2" />
                          <label htmlFor="email-report" className="text-sm">
                            Email report upon completion
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                        onClick={() => selectedTemplate && generateReport(selectedTemplate)}
                        disabled={!selectedTemplate || loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Preview */}
            {reportData && selectedTemplate && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>Sample data from your farm</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        ${reportData.financial_summary.total_revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                      {getTrendIcon(reportData.trends.revenue_trend)}
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">
                        {reportData.operational_metrics.total_crops}
                      </div>
                      <div className="text-sm text-gray-600">Active Crops</div>
                      {getTrendIcon(reportData.trends.productivity_trend)}
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {reportData.performance_indicators.overall_efficiency}%
                      </div>
                      <div className="text-sm text-gray-600">Efficiency Score</div>
                      {getTrendIcon(reportData.trends.efficiency_trend)}
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-600">
                        {reportData.performance_indicators.task_completion_rate}%
                      </div>
                      <div className="text-sm text-gray-600">Task Completion</div>
                      {getTrendIcon('up')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Generated Reports</h2>
              <div className="flex items-center space-x-4">
                <Input placeholder="Search reports..." className="w-64" />
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  name: 'Financial Overview Report',
                  type: 'PDF',
                  date: '2024-11-01',
                  size: '2.3 MB',
                  status: 'completed',
                },
                {
                  name: 'Operational Performance Report',
                  type: 'Excel',
                  date: '2024-11-05',
                  size: '1.8 MB',
                  status: 'completed',
                },
                {
                  name: 'Custom Dashboard Report',
                  type: 'PDF',
                  date: '2024-11-03',
                  size: '3.1 MB',
                  status: 'completed',
                },
                {
                  name: 'Inventory Analysis Report',
                  type: 'Excel',
                  date: '2024-11-02',
                  size: '1.5 MB',
                  status: 'completed',
                },
              ].map((report, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-medium text-gray-900">{report.name}</h3>
                          <p className="text-sm text-gray-600">
                            Generated on {report.date} • {report.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 text-green-800">{report.status}</Badge>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && reportData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Report Generation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">247</div>
                  <p className="text-sm text-gray-600 mt-2">Reports this year</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Download Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">94%</div>
                  <p className="text-sm text-gray-600 mt-2">Successful downloads</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">2.8m</div>
                  <p className="text-sm text-gray-600 mt-2">Generation time</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Popular Format
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">PDF</div>
                  <p className="text-sm text-gray-600 mt-2">67% of reports</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Report Usage Trends</CardTitle>
                  <CardDescription>Monthly report generation and download patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      Report usage chart visualization would appear here
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Template Performance</CardTitle>
                  <CardDescription>
                    Most popular report templates and their usage rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportTemplates.slice(0, 4).map((template, _index) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{template.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(template.download_count / 67) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8">{template.download_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
