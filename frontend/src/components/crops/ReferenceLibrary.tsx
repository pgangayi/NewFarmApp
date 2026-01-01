import { useState } from 'react';
import { Search, BookOpen, ExternalLink, Filter, Sprout, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useCropVarieties, useAddCropVariety } from '../../api';
import { UnifiedModal } from '../ui/UnifiedModal';

export function ReferenceLibrary() {
  const [activeTab, setActiveTab] = useState<'guides' | 'varieties'>('varieties');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Agricultural Knowledge Base
          </h2>
          <p className="text-sm text-gray-500">Access crop varieties, guides, and best practices.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('varieties')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'varieties' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Crop Varieties
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'guides' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Guides & Articles
          </button>
        </div>
      </div>

      {activeTab === 'varieties' ? <VarietiesList /> : <GuidesList />}
    </div>
  );
}

function VarietiesList() {
  const { data: varieties = [], isLoading } = useCropVarieties();
  const addVarietyMutation = useAddCropVariety();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVarieties = varieties.filter(
    v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.crop_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search varieties..." 
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="ml-4 bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Variety
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading varieties...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredVarieties.map(variety => (
            <div key={variety.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{variety.name}</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {variety.crop_type}
                </Badge>
              </div>
              {variety.days_to_maturity && (
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <Sprout className="h-3 w-3" />
                  {variety.days_to_maturity} days to maturity
                </div>
              )}
              {variety.description && (
                <p className="text-sm text-gray-600 line-clamp-3">{variety.description}</p>
              )}
            </div>
          ))}
          
          {filteredVarieties.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No varieties found. Add one to get started.
            </div>
          )}
        </div>
      )}

      <UnifiedModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Crop Variety"
        fields={[
          {
            name: 'crop_type',
            label: 'Crop Type',
            type: 'select',
            required: true,
            options: [
              { value: 'Corn', label: 'Corn' },
              { value: 'Wheat', label: 'Wheat' },
              { value: 'Soybeans', label: 'Soybeans' },
              { value: 'Cotton', label: 'Cotton' },
              { value: 'Rice', label: 'Rice' },
              { value: 'Vegetables', label: 'Vegetables' },
            ],
          },
          { name: 'name', label: 'Variety Name', type: 'text', required: true },
          { name: 'days_to_maturity', label: 'Days to Maturity', type: 'number' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        onSubmit={data => {
          addVarietyMutation.mutate(data as any);
          setShowAddModal(false);
        }}
        size="sm"
      />
    </div>
  );
}

function GuidesList() {
  const articles = [
    {
      id: 1,
      title: 'Optimal Irrigation for Corn',
      category: 'Irrigation',
      readTime: '5 min',
      tags: ['Corn', 'Water Management'],
    },
    {
      id: 2,
      title: 'Pest Identification Guide: Fall Armyworm',
      category: 'Pests',
      readTime: '8 min',
      tags: ['Pests', 'Corn', 'Sorghum'],
    },
    {
      id: 3,
      title: 'Soil Nutrient Balancing Requirements',
      category: 'Soil Health',
      readTime: '12 min',
      tags: ['Soil', 'Fertilizer'],
    },
    {
      id: 4,
      title: 'Crop Rotation Best Practices',
      category: 'Planning',
      readTime: '7 min',
      tags: ['Rotation', 'Sustainability'],
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search guides..." className="pl-10" />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="divide-y divide-gray-200">
        {articles.map((article) => (
          <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {article.category}
                  </Badge>
                  <span className="text-xs text-gray-500">{article.readTime} read</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  {article.title}
                </h3>
                <div className="flex gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-600">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
