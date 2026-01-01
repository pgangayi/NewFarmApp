import { Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Livestock } from '../../api';
import type { FilterState } from '../../types/ui';

interface LivestockListProps {
  livestock: Livestock[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onEdit: (item: Livestock) => void;
  onDelete: (item: Livestock) => void;
}

export function LivestockList({
  livestock,
  filters,
  showFilters,
  setShowFilters,
  onEdit,
  onDelete,
}: LivestockListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Livestock ({livestock.length})</h2>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Filter implementation coming soon...</p>
        </div>
      )}

      <div className="grid gap-4">
        {livestock.map(item => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-lg flex items-center justify-between shadow-sm border"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {item.name || item.identification_tag}
                </span>
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {item.species} • {item.breed || 'Unknown Breed'} • {item.sex}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(item)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}

        {livestock.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <p className="text-gray-500">No livestock found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
