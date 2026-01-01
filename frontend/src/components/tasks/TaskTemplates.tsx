import type { TaskTemplate } from './types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

interface TaskTemplatesProps {
  templates: TaskTemplate[];
  onCreateTemplate: () => void;
}

export function TaskTemplates({ templates, onCreateTemplate }: TaskTemplatesProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Task Templates</h2>
        <Button onClick={onCreateTemplate} size="sm">
          <Plus className="h-4 w-4 mr-2" /> New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
          <p className="text-gray-500">No templates found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardContent className="pt-6">
                <h3 className="font-medium">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-2">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
