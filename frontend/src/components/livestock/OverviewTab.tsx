import type { Livestock } from '../../api';

interface OverviewTabProps {
  livestock: Livestock[];
}

export function OverviewTab({ livestock }: OverviewTabProps) {
  const activeCount = livestock.filter(l => l.status === 'active').length;
  const soldCount = livestock.filter(l => l.status === 'sold').length;
  const deceasedCount = livestock.filter(l => l.status === 'deceased').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">Total Active</h3>
        <p className="text-2xl font-bold text-gray-900 mt-2">{activeCount}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">Total Sold</h3>
        <p className="text-2xl font-bold text-blue-600 mt-2">{soldCount}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">Total Deceased</h3>
        <p className="text-2xl font-bold text-red-600 mt-2">{deceasedCount}</p>
      </div>
    </div>
  );
}
