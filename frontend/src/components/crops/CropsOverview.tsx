import { Leaf, Sprout, Calendar, CheckCircle } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search } from 'lucide-react';
import type { Crop } from '../../api';

interface CropsOverviewProps {
  crops: Crop[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function CropsOverview({ crops, searchQuery, setSearchQuery }: CropsOverviewProps) {
  const stats = {
    total: crops.length,
    active: crops.filter(c => c.status === 'active').length,
    planned: crops.filter(c => c.status === 'planned').length,
    harvested: crops.filter(c => c.status === 'harvested').length,
  };

  const filteredCrops = crops.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.crop_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Crops" value={stats.total} icon={Leaf} color="green" />
        <StatCard title="Active" value={stats.active} icon={Sprout} color="emerald" />
        <StatCard title="Planned" value={stats.planned} icon={Calendar} color="blue" />
        <StatCard title="Harvested" value={stats.harvested} icon={CheckCircle} color="orange" />
      </div>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Crops</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search crops..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCrops.map(crop => (
              <div
                key={crop.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{crop.name}</h4>
                    <p className="text-sm text-gray-500">
                      {crop.crop_type} • {crop.variety}
                    </p>
                  </div>
                </div>
                <Badge variant={crop.status === 'active' ? 'default' : 'secondary'}>
                  {crop.status}
                </Badge>
              </div>
            ))}
            {filteredCrops.length === 0 && (
              <p className="text-center text-gray-500 py-4">No crops found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
