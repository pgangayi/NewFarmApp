import type { Crop } from '../../api';

interface CropsOverviewProps {
  crops: Crop[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function CropsOverview({ crops, searchQuery, setSearchQuery }: CropsOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Crop Overview</h3>
        <p className="text-gray-500 mb-4">
          Total Crops Managed: <span className="font-bold text-gray-900">{crops.length}</span>
        </p>
        {/* Add more metrics/charts here */}
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h4 className="font-medium mb-2">Quick List</h4>
        {/* Simple list or table of crops */}
        {crops.length === 0 ? (
          <p className="text-gray-500 text-sm">No crops added yet.</p>
        ) : (
          <ul className="divide-y">
            {crops.map(crop => (
              <li key={crop.id} className="py-2 flex justify-between">
                <span>{crop.name}</span>
                <span className="text-sm text-gray-500 capitalize">{crop.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
