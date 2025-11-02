import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { MapPin, Save, Loader2 } from 'lucide-react';

interface Farm {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

interface FarmLocationManagerProps {
  farm: Farm;
  onLocationUpdated?: (farm: Farm) => void;
}

export function FarmLocationManager({ farm, onLocationUpdated }: FarmLocationManagerProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    latitude: farm.latitude?.toString() || '',
    longitude: farm.longitude?.toString() || '',
    timezone: farm.timezone || ''
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = session?.access_token;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_farm_location',
          farm_id: farm.id,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          timezone: data.timezone
        })
      });
      
      if (!response.ok) throw new Error('Failed to update farm location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      setIsOpen(false);
      onLocationUpdated?.({
        ...farm,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        timezone: formData.timezone
      });
    }
  });

  const commonTimezones = [
    'UTC',
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Africa/Johannesburg',
    'Africa/Nairobi'
  ];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const isLocationSet = farm.latitude && farm.longitude;

  return (
    <div className="border rounded-lg p-6 bg-white shadow">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Farm Location</h3>
      </div>
      
      {isLocationSet ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Latitude:</span>
              <p className="font-mono">{farm.latitude?.toFixed(6)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Longitude:</span>
              <p className="font-mono">{farm.longitude?.toFixed(6)}</p>
            </div>
          </div>
          
          {farm.timezone && (
            <div>
              <span className="font-medium text-gray-600">Timezone:</span>
              <p>{farm.timezone}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Weather integration active</span>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(true)} 
            className="w-full"
          >
            Update Location
          </Button>
          
          {isOpen && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Update Farm Location</h4>
              
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                >
                  Use Current Location
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="latitude" className="text-sm font-medium">Latitude</label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g., -1.2921"
                    className="w-full p-2 border rounded"
                    value={formData.latitude}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, latitude: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="longitude" className="text-sm font-medium">Longitude</label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 36.8219"
                    className="w-full p-2 border rounded"
                    value={formData.longitude}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, longitude: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="timezone" className="text-sm font-medium">Timezone</label>
                <select
                  id="timezone"
                  className="w-full p-2 border rounded"
                  value={formData.timezone}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    setFormData(prev => ({ ...prev, timezone: e.target.value }))
                  }
                >
                  <option value="">Select timezone</option>
                  {commonTimezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateLocationMutation.mutate(formData)}
                  disabled={!formData.latitude || !formData.longitude || updateLocationMutation.isPending}
                >
                  {updateLocationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Location
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-sm">Location not set</span>
          </div>
          <p className="text-sm text-gray-600">
            Set your farm location to enable weather data and agricultural recommendations.
          </p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
              >
                Use Current Location
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="latitude" className="text-sm font-medium">Latitude</label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., -1.2921"
                  className="w-full p-2 border rounded"
                  value={formData.latitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData(prev => ({ ...prev, latitude: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="longitude" className="text-sm font-medium">Longitude</label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 36.8219"
                  className="w-full p-2 border rounded"
                  value={formData.longitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData(prev => ({ ...prev, longitude: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="timezone" className="text-sm font-medium">Timezone</label>
              <select
                id="timezone"
                className="w-full p-2 border rounded"
                value={formData.timezone}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setFormData(prev => ({ ...prev, timezone: e.target.value }))
                }
              >
                <option value="">Select timezone</option>
                {commonTimezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => updateLocationMutation.mutate(formData)}
                disabled={!formData.latitude || !formData.longitude || updateLocationMutation.isPending}
              >
                {updateLocationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Location
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmLocationManager;