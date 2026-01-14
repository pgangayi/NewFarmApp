import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import type { BudgetCategory } from './types';
import { Progress } from '../ui/progress';

interface BudgetProgressProps {
  budgets: BudgetCategory[];
  onCreateBudget: () => void;
}

export function BudgetProgress({ budgets, onCreateBudget }: BudgetProgressProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Budget Overview</h2>
        <Button onClick={onCreateBudget} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Set Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
            No budgets set for this fiscal year.
          </div>
        ) : (
          budgets.map(budget => {
            const percentage = Math.min((budget.spent / budget.budget_limit) * 100, 100);
            const isOverBudget = budget.spent > budget.budget_limit;

            return (
              <Card key={budget.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium">{budget.category}</CardTitle>
                    <span className={isOverBudget ? 'text-red-600 font-bold' : 'text-gray-600'}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress
                    value={percentage}
                    className={`h-2 ${isOverBudget ? 'bg-red-200' : ''}`}
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>Spent: ${budget.spent.toLocaleString()}</span>
                    <span>Limit: ${budget.budget_limit.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
