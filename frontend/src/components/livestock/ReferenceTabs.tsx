import { useState } from 'react';
import { useBreeds, useAddBreed, useInventory } from '../../api';
import { Plus, Search, AlertCircle, Package } from 'lucide-react';
import { UnifiedModal } from '../ui/UnifiedModal';
import { useFarmWithSelection } from '../../api';

export function HealthReference() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Health Reference</h3>
          <p className="text-gray-500 text-sm">Common diseases and treatments database.</p>
        </div>
        <button className="text-blue-600 text-sm font-medium hover:underline">
          View Full Database
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-red-50 border-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Mastitis</h4>
              <p className="text-sm text-red-700 mt-1">
                Inflammation of the udder tissue. Common in dairy cattle.
              </p>
              <div className="mt-2 text-xs font-medium text-red-800 bg-red-200 inline-block px-2 py-1 rounded">
                Critical
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Foot Rot</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Bacterial infection of the hoof. Common in sheep and cattle.
              </p>
              <div className="mt-2 text-xs font-medium text-yellow-800 bg-yellow-200 inline-block px-2 py-1 rounded">
                Moderate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BreedsRepository() {
  const { data: breeds = [], isLoading } = useBreeds();
  const addBreedMutation = useAddBreed();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBreeds = breeds.filter(
    b =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.species.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">Breeds Repository</h3>
            <p className="text-gray-500 text-sm">Manage animal breeds and characteristics.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Breed
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search breeds..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading breeds...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBreeds.map(breed => (
              <div
                key={breed.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{breed.name}</h4>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {breed.species}
                    </span>
                  </div>
                </div>
                {breed.characteristics && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{breed.characteristics}</p>
                )}
              </div>
            ))}

            {filteredBreeds.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                No breeds found matching your search.
              </div>
            )}
          </div>
        )}
      </div>

      <UnifiedModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Breed"
        fields={[
          {
            name: 'species',
            label: 'Species',
            type: 'select',
            required: true,
            options: [
              { value: 'Cattle', label: 'Cattle' },
              { value: 'Sheep', label: 'Sheep' },
              { value: 'Pig', label: 'Pig' },
              { value: 'Chicken', label: 'Chicken' },
              { value: 'Goat', label: 'Goat' },
            ],
          },
          { name: 'name', label: 'Breed Name', type: 'text', required: true },
          { name: 'description', label: 'Characteristics / Description', type: 'textarea' },
        ]}
        onSubmit={data => {
          addBreedMutation.mutate(data as any);
          setShowAddModal(false);
        }}
        size="sm"
      />
    </div>
  );
}

export function FeedManagement() {
  const { currentFarm } = useFarmWithSelection();
  const { data: inventory = [] } = useInventory(currentFarm?.id);

  // Filter for feed items (assuming category 'feed' or similar)
  const feedItems = inventory.filter(
    item =>
      item.category?.toLowerCase() === 'feed' ||
      item.name.toLowerCase().includes('feed') ||
      item.name.toLowerCase().includes('hay') ||
      item.name.toLowerCase().includes('grain')
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Feed Inventory</h3>
          <p className="text-gray-500 text-sm">Monitor feed stock levels.</p>
        </div>
        <button className="text-green-600 text-sm font-medium hover:underline flex items-center gap-1">
          <Package className="h-4 w-4" />
          Manage Inventory
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feedItems.length > 0 ? (
              feedItems.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        Number(item.quantity) < 10
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {Number(item.quantity) < 10 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No feed items found in inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
