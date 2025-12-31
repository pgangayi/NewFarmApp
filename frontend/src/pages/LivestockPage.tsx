import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { Plus, Heart, TrendingUp, Stethoscope, Droplets, Ruler } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { LoadingErrorContent } from '../components/ui/LoadingStates';
import { useConfirmation, ConfirmDialogs } from '../components/ui/ConfirmationDialog';
import { UnifiedModal } from '../components/ui/UnifiedModal';
import { OverviewTab } from '../components/livestock/OverviewTab';
import { LivestockList } from '../components/livestock/LivestockList';
import {
  HealthReference,
  BreedsRepository,
  FeedManagement,
} from '../components/livestock/ReferenceTabs';

// Unified API Imports
import {
  useLivestock,
  useFarmWithSelection,
  useCreateLivestock,
  useUpdateLivestock,
  useDeleteLivestock,
  useBreeds,
} from '../api';
import type { Livestock, ModalField, Breed } from '../api';
import type { FilterState } from '../types/ui';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TabValues = 'overview' | 'list' | 'health' | 'breeding' | 'feed';

const TABS: { value: TabValues; label: string; icon: any }[] = [
  { value: 'overview', label: 'Overview', icon: TrendingUp },
  { value: 'list', label: 'Livestock List', icon: Heart },
  { value: 'health', label: 'Health Reference', icon: Stethoscope },
  { value: 'breeding', label: 'Breeds & Growth', icon: Ruler },
  { value: 'feed', label: 'Feed & Nutrition', icon: Droplets },
];

const defaultFilters: FilterState = {
  search: '',
  species: '',
  breed: '',
  health_status: '',
  sex: '',
  production_type: '',
  status: '',
  location: '',
  intake_type: '',
  pedigree_search: '',
  sort_by: 'created_at',
  sort_order: 'desc',
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LivestockPage() {
  const { isAuthenticated } = useAuth();
  const { currentFarm } = useFarmWithSelection();
  const [activeTab, setActiveTab] = useState<TabValues>('list');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Livestock | null>(null);

  const { confirm, ConfirmationDialog } = useConfirmation();

  // API Hooks
  const { data: livestock = [], isLoading, error, refetch } = useLivestock(currentFarm?.id);
  const { data: breeds = [] } = useBreeds();
  const createMutation = useCreateLivestock();
  const updateMutation = useUpdateLivestock();
  const deleteMutation = useDeleteLivestock();

  // Actions
  const handleCreate = (data: any) => createMutation.mutate(data);
  const handleUpdate = (data: any) => updateMutation.mutate({ id: data.id, data });
  const handleDelete = async (item: Livestock) => {
    const confirmed = await confirm(
      ConfirmDialogs.delete(item.name || item.identification_tag || 'Item')
    );
    if (confirmed) deleteMutation.mutate(item.id);
  };

  const handleEdit = (item: Livestock) => {
    setEditingItem(item);
    setShowModal(true);
  };

  // Auth & Farm Checks
  if (!isAuthenticated()) return <LoginRequired />;
  if (!currentFarm) return <NoFarmSelected />;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: `url('/Livestock Wallpaper.png')`, backgroundSize: 'cover' }}
      />

      {/* Header & Nav */}
      <div className="relative z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-4" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="h-6 w-6 text-blue-600" />
                Livestock Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">{currentFarm.name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setShowModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Animal
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.value
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingErrorContent isLoading={isLoading} error={error} onRetry={refetch}>
          {activeTab === 'overview' && <OverviewTab livestock={livestock} />}
          {activeTab === 'list' && (
            <LivestockList
              livestock={livestock}
              filters={filters}
              setFilters={setFilters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          {activeTab === 'health' && <HealthReference />}
          {activeTab === 'breeding' && <BreedsRepository />}
          {activeTab === 'feed' && <FeedManagement />}
        </LoadingErrorContent>
      </main>

      {/* Modal */}
      <UnifiedModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Animal' : 'Register New Animal'}
        fields={getLivestockFields(breeds)}
        initialData={
          editingItem || {
            farm_id: currentFarm.id,
            status: 'active',
            intake_date: new Date().toISOString().split('T')[0],
          }
        }
        onSubmit={data => {
          if (editingItem) handleUpdate({ ...data, id: editingItem.id });
          else handleCreate(data);
          setShowModal(false);
        }}
        size="xl"
      />

      {ConfirmationDialog}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function LoginRequired() {
  return (
    <div className="h-screen flex items-center justify-center">
      Please log in to access this page.
    </div>
  );
}

function NoFarmSelected() {
  return <div className="h-screen flex items-center justify-center">Please select a farm.</div>;
}

function getLivestockFields(breeds: Breed[]): ModalField[] {
  return [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Bessie' },
    {
      name: 'identification_tag',
      label: 'Tag / ID',
      type: 'text',
      required: true,
      placeholder: 'e.g. UK-123-456',
    },
    {
      name: 'species',
      label: 'Species',
      type: 'select',
      required: true,
      options: [
        { value: 'cattle', label: 'Cattle' },
        { value: 'sheep', label: 'Sheep' },
        { value: 'pig', label: 'Pig' },
        { value: 'chicken', label: 'Chicken' },
      ],
    },
    { name: 'breed', label: 'Breed', type: 'text', placeholder: 'Enter breed name' }, // Fallback text input
    {
      name: 'sex',
      label: 'Sex',
      type: 'select',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ],
    },
    { name: 'birth_date', label: 'Birth Date', type: 'date' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'sold', label: 'Sold' },
        { value: 'deceased', label: 'Deceased' },
      ],
    },
    { name: 'current_weight', label: 'Current Weight (kg)', type: 'number', step: '0.1' },
  ];
}
