import { Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { Livestock } from '../../api';

interface LivestockCardProps {
  item: Livestock;
  onEdit: (item: Livestock) => void;
  onDelete: (item: Livestock) => void;
}

export function LivestockCard({ item, onEdit, onDelete }: LivestockCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            {item.name || item.identification_tag}
            {item.sex === 'male' ? (
              <span className="text-blue-500 text-xs">♂</span>
            ) : (
              <span className="text-pink-500 text-xs">♀</span>
            )}
          </CardTitle>
          <CardDescription className="uppercase text-xs font-semibold tracking-wide text-gray-500">
            {item.species}
          </CardDescription>
        </div>
        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2 text-gray-600 mt-2">
          {item.breed && (
            <div className="flex justify-between">
              <span>Breed:</span> <span className="font-medium text-gray-900">{item.breed}</span>
            </div>
          )}
          {item.identification_tag && (
            <div className="flex justify-between">
              <span>Tag:</span>{' '}
              <span className="font-medium text-gray-900">{item.identification_tag}</span>
            </div>
          )}
          {item.current_weight && (
            <div className="flex justify-between">
              <span>Weight:</span>{' '}
              <span className="font-medium text-gray-900">{item.current_weight} kg</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
