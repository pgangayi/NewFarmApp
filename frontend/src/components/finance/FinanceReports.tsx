import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Download } from 'lucide-react';

interface FinanceReportsProps {
  onGenerateReport: () => void;
  isGenerating: boolean;
}

export function FinanceReports({ onGenerateReport, isGenerating }: FinanceReportsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Download detailed financial statements for your farm operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={onGenerateReport}
              disabled={isGenerating}
            >
              <FileText className="h-8 w-8 text-blue-500" />
              <span>Monthly Statement</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" disabled>
              <FileText className="h-8 w-8 text-green-500" />
              <span>Tax Report (Coming Soon)</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" disabled>
              <FileText className="h-8 w-8 text-purple-500" />
              <span>Annual Review (Coming Soon)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">No reports generated recently.</div>
        </CardContent>
      </Card>
    </div>
  );
}
