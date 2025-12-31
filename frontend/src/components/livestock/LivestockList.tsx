import { Search, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LivestockCard } from './LivestockCard';
import type { Livestock } from '../../api';
import type { FilterState } from '../../types/ui';

interface LivestockListProps {
  livestock: Livestock[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onEdit: (item: Livestock) => void;
  onDelete: (item: Livestock) => void;
}

export function LivestockList({
  livestock,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  onEdit,
  onDelete,
}: LivestockListProps) {
  // Filter Logic
  const filtered = livestock.filter((l: Livestock) => {
    if (
      filters.search &&
      !l.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !l.identification_tag?.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    if (filters.species && l.species !== filters.species) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, tag, or ID..."
            className="pl-9"
            value={filters.search}
            onChange={(e: any) => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((item: Livestock) => (
          <LivestockCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No livestock found matching your criteria.
        </div>
      )}
    </div>
  );
}
