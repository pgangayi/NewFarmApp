import { Plus, Target, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TaskTemplate } from './types';

interface TaskTemplatesProps {
  templates: TaskTemplate[];
  onCreateTemplate: () => void;
}

export function TaskTemplates({ templates, onCreateTemplate }: TaskTemplatesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Task Templates</h2>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={onCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="text-lg">{template.template_name}</CardTitle>
              <CardDescription>Category: {template.category}</CardDescription>
            </CardHeader>
            <CardContent>
              {template.description && (
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              )}
              <div className="space-y-2">
                {template.estimated_duration && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium">{template.estimated_duration}h</span>
                  </div>
                )}
                {template.priority_level && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <span className="text-sm font-medium">{template.priority_level}/10</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge variant="default">{template.category}</Badge>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!templates || templates.length === 0) && (
          <div className="col-span-full text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No templates</h4>
            <p className="text-gray-600 mb-4">
              Create reusable task templates for common activities
            </p>
            <Button onClick={onCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
