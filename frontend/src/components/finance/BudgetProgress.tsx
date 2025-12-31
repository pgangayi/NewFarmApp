import { Plus, Target, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { BudgetCategory } from './types';

interface BudgetProgressProps {
  budgets: BudgetCategory[];
  onCreateBudget: () => void;
}

export function BudgetProgress({ budgets, onCreateBudget }: BudgetProgressProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Budget Categories</h2>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={onCreateBudget}>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets?.map(budget => (
          <Card key={budget.id}>
            <CardHeader>
              <CardTitle className="text-lg">{budget.category_name}</CardTitle>
              <CardDescription>Fiscal Year {budget.fiscal_year}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Budgeted:</span>
                  <span className="text-sm font-medium">
                    ${budget.budgeted_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Spent:</span>
                  <span className="text-sm font-medium">
                    ${budget.spent_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Remaining:</span>
                  <span
                    className={`text-sm font-medium ${
                      budget.remaining_budget >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${budget.remaining_budget.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilization</span>
                    <span>{Math.round((budget.spent_amount / budget.budgeted_amount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        budget.spent_amount / budget.budgeted_amount > 1
                          ? 'bg-red-500'
                          : budget.spent_amount / budget.budgeted_amount > 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((budget.spent_amount / budget.budgeted_amount) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge variant="default">{budget.farm_name}</Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => alert('Budget editing coming soon!')}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!budgets || budgets.length === 0) && (
          <div className="col-span-full text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No budgets</h4>
            <p className="text-gray-600 mb-4">Create budget categories to track spending</p>
            <Button onClick={onCreateBudget}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Budget
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
