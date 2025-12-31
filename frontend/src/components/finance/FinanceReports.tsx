import { Plus, Download, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface FinanceReportsProps {
  onGenerateReport: () => void;
  isGenerating: boolean;
}

export function FinanceReports({ onGenerateReport, isGenerating }: FinanceReportsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Financial Reports</h2>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onGenerateReport}
          disabled={isGenerating}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Comprehensive monthly financial summary including revenue, expenses, and profit
              analysis.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => alert('Monthly report generation coming soon!')}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Monthly
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quarterly Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Detailed quarterly analysis with trends, comparisons, and performance metrics.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => alert('Quarterly report generation coming soon!')}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Quarterly
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tax Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Tax-deductible expenses and income summary for tax preparation.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => alert('Tax export functionality coming soon!')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Export for Tax
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
