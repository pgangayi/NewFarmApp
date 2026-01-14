import { useState } from 'react';
// import { useAnimals } from '../hooks';

export interface CreateAnimalForm {
  id?: string;
  farm_id: string;
  name: string;
  species: string;
  breed: string;
  identification_tag: string;
  birth_date?: string;
  sex?: 'male' | 'female';
  health_status?: string;
  intake_type: string;
  intake_date: string;
  purchase_price?: number;
  seller_details?: string;
  father_id?: string;
  mother_id?: string;
  current_location_id?: string;
  production_type?: string;
  status: string;
  current_weight?: number;
  target_weight?: number;
  vaccination_status?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
}
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { X, Plus } from 'lucide-react';

interface AnimalFormProps {
  animal?: Partial<CreateAnimalForm>;
  onSubmit: (data: CreateAnimalForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const speciesOptions = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'chicken', label: 'Chicken' },
  { value: 'pig', label: 'Pig' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'goat', label: 'Goat' },
];

const intakeTypeOptions = [
  { value: 'Birth', label: 'Birth' },
  { value: 'Purchase', label: 'Purchase' },
  { value: 'Transfer', label: 'Transfer' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'sold', label: 'Sold' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'slaughtered', label: 'Slaughtered' },
  { value: 'retired', label: 'Retired' },
];

export function AnimalForm({ animal, onSubmit, onCancel, isLoading = false }: AnimalFormProps) {
  const [formData, setFormData] = useState<CreateAnimalForm>({
    farm_id: animal?.farm_id || '',
    name: animal?.name || '',
    species: animal?.species || '',
    breed: animal?.breed || '',
    identification_tag: animal?.identification_tag || '',
    birth_date: animal?.birth_date,
    sex: animal?.sex,
    health_status: animal?.health_status,
    intake_type: animal?.intake_type || 'Birth',
    intake_date: animal?.intake_date || (new Date().toISOString().split('T')[0] as string),
    purchase_price: animal?.purchase_price,
    seller_details: animal?.seller_details || '',
    father_id: animal?.father_id,
    mother_id: animal?.mother_id,
    current_location_id: animal?.current_location_id || '',
    production_type: animal?.production_type,
    status: animal?.status || 'active',
    current_weight: animal?.current_weight,
    target_weight: animal?.target_weight,
    vaccination_status: animal?.vaccination_status,
    acquisition_date: animal?.acquisition_date,
    acquisition_cost: animal?.acquisition_cost,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof CreateAnimalForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              {animal?.id ? 'Edit Animal' : 'Add New Animal'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Animal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="Enter animal name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="species">Species *</Label>
                <Select
                  value={formData.species}
                  onValueChange={value => updateField('species', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed || ''}
                  onChange={e => updateField('breed', e.target.value)}
                  placeholder="Enter breed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identification_tag">Identification Tag *</Label>
                <Input
                  id="identification_tag"
                  value={formData.identification_tag}
                  onChange={e => updateField('identification_tag', e.target.value)}
                  placeholder="Enter ID tag"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select
                  value={formData.sex || ''}
                  onValueChange={value => updateField('sex', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Birth Date</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={e => updateField('birth_date', e.target.value)}
                />
              </div>
            </div>

            {/* Intake Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Intake Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="intake_type">Intake Type *</Label>
                  <Select
                    value={formData.intake_type}
                    onValueChange={value => updateField('intake_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select intake type" />
                    </SelectTrigger>
                    <SelectContent>
                      {intakeTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intake_date">Intake Date *</Label>
                  <Input
                    id="intake_date"
                    type="date"
                    value={formData.intake_date}
                    onChange={e => updateField('intake_date', e.target.value)}
                    required
                  />
                </div>

                {formData.intake_type === 'Purchase' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="purchase_price">Purchase Price</Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        step="0.01"
                        value={formData.purchase_price || ''}
                        onChange={e =>
                          updateField('purchase_price', parseFloat(e.target.value) || undefined)
                        }
                        placeholder="Enter purchase price"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seller_details">Seller Details</Label>
                      <Textarea
                        id="seller_details"
                        value={formData.seller_details}
                        onChange={e => updateField('seller_details', e.target.value)}
                        placeholder="Enter seller information"
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pedigree Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedigree Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="father_id">Father ID</Label>
                  <Input
                    id="father_id"
                    value={formData.father_id || ''}
                    onChange={e => updateField('father_id', e.target.value)}
                    placeholder="Enter father animal ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mother_id">Mother ID</Label>
                  <Input
                    id="mother_id"
                    value={formData.mother_id || ''}
                    onChange={e => updateField('mother_id', e.target.value)}
                    placeholder="Enter mother animal ID"
                  />
                </div>
              </div>
            </div>

            {/* Location and Status */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="current_location_id">Current Location</Label>
                  <Input
                    id="current_location_id"
                    value={formData.current_location_id}
                    onChange={e => updateField('current_location_id', e.target.value)}
                    placeholder="Enter location ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => updateField('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="current_weight">Current Weight (kg)</Label>
                  <Input
                    id="current_weight"
                    type="number"
                    step="0.1"
                    value={formData.current_weight || ''}
                    onChange={e =>
                      updateField('current_weight', parseFloat(e.target.value) || undefined)
                    }
                    placeholder="Enter current weight"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_weight">Target Weight (kg)</Label>
                  <Input
                    id="target_weight"
                    type="number"
                    step="0.1"
                    value={formData.target_weight || ''}
                    onChange={e =>
                      updateField('target_weight', parseFloat(e.target.value) || undefined)
                    }
                    placeholder="Enter target weight"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production_type">Production Type</Label>
                  <Select
                    value={formData.production_type || ''}
                    onValueChange={value => updateField('production_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select production type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meat">Meat</SelectItem>
                      <SelectItem value="milk">Milk</SelectItem>
                      <SelectItem value="eggs">Eggs</SelectItem>
                      <SelectItem value="wool">Wool</SelectItem>
                      <SelectItem value="breeding">Breeding</SelectItem>
                      <SelectItem value="companion">Companion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vaccination_status">Vaccination Status</Label>
                  <Select
                    value={formData.vaccination_status || ''}
                    onValueChange={value => updateField('vaccination_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vaccination status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up_to_date">Up to Date</SelectItem>
                      <SelectItem value="due_soon">Due Soon</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="not_vaccinated">Not Vaccinated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : animal?.id ? 'Update Animal' : 'Create Animal'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
