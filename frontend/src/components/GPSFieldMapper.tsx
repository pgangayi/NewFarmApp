import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { MapPin, Navigation, Target, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface FieldBoundary {
  id: string;
  name: string;
  coordinates: GPSCoordinate[];
  area?: number; // in hectares
  perimeter?: number; // in meters
}

interface GPSFieldMapperProps {
  farmId: string;
  existingFields?: FieldBoundary[];
  onFieldSave?: (field: FieldBoundary) => void;
  onFieldUpdate?: (fieldId: string, field: FieldBoundary) => void;
}

export function GPSFieldMapper({
  farmId: _farmId,
  existingFields = [],
  onFieldSave,
  onFieldUpdate,
}: GPSFieldMapperProps) {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number>();

  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GPSCoordinate | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [selectedField, setSelectedField] = useState<FieldBoundary | null>(null);
  // const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<GPSCoordinate[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');

  // Check geolocation permission on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermissionStatus(result.state);
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      });
    }
  }, []);

  // Get current position
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'GPS Not Supported',
        description: 'Geolocation is not supported by this browser.',
        variant: 'destructive',
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    };

    navigator.geolocation.getCurrentPosition(
      position => {
        const coords: GPSCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setCurrentPosition(coords);
        setAccuracy(position.coords.accuracy);
      },
      error => {
        console.error('Error getting position:', error);
        toast({
          title: 'GPS Error',
          description: getErrorMessage(error.code),
          variant: 'destructive',
        });
      },
      options
    );
  }, [toast]);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'GPS Not Supported',
        description: 'Geolocation is not supported by this browser.',
        variant: 'destructive',
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const coords: GPSCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setCurrentPosition(coords);
        setAccuracy(position.coords.accuracy);
      },
      error => {
        console.error('Error watching position:', error);
        toast({
          title: 'GPS Tracking Error',
          description: getErrorMessage(error.code),
          variant: 'destructive',
        });
        stopTracking();
      },
      options
    );

    setIsTracking(true);
    toast({
      title: 'GPS Tracking Started',
      description: 'Your location is being tracked in real-time.',
    });
  }, [toast]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = undefined;
    }
    setIsTracking(false);
    toast({
      title: 'GPS Tracking Stopped',
      description: 'Location tracking has been stopped.',
    });
  }, [toast]);

  // Add current position to field boundary
  const addToBoundary = useCallback(() => {
    if (!currentPosition) {
      toast({
        title: 'No GPS Position',
        description: 'Please get your current position first.',
        variant: 'destructive',
      });
      return;
    }

    if (accuracy && accuracy > 50) {
      toast({
        title: 'Poor GPS Accuracy',
        description: `Current accuracy is ${accuracy.toFixed(1)}m. Please wait for better accuracy.`,
        variant: 'destructive',
      });
      return;
    }

    setCurrentPath(prev => [...prev, currentPosition]);
    toast({
      title: 'Point Added',
      description: `Added point ${currentPath.length + 1} to field boundary.`,
    });
  }, [currentPosition, accuracy, currentPath.length, toast]);

  // Calculate field area and perimeter
  const calculateFieldMetrics = useCallback((coordinates: GPSCoordinate[]) => {
    if (coordinates.length < 3) return { area: 0, perimeter: 0 };

    // Calculate area using shoelace formula
    let area = 0;
    let perimeter = 0;

    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const xi = coordinates[i]!.longitude;
      const yi = coordinates[i]!.latitude;
      const xj = coordinates[j]!.longitude;
      const yj = coordinates[j]!.latitude;

      area += xi * yj - xj * yi;

      // Calculate distance between points for perimeter
      const distance = getDistance(coordinates[i]!, coordinates[j]!);
      perimeter += distance;
    }

    area = Math.abs(area) / 2;

    // Convert to hectares (rough approximation)
    // 1 degree² ≈ 111km² at equator, but this is simplified
    const areaHectares = Math.abs(area) * 111 * 111 * 100; // Convert to hectares

    return {
      area: areaHectares,
      perimeter: perimeter,
    };
  }, []);

  // Save field boundary
  const saveField = useCallback(() => {
    if (!fieldName.trim()) {
      toast({
        title: 'Field Name Required',
        description: 'Please enter a name for the field.',
        variant: 'destructive',
      });
      return;
    }

    if (currentPath.length < 3) {
      toast({
        title: 'Insufficient Points',
        description: 'Please add at least 3 points to define the field boundary.',
        variant: 'destructive',
      });
      return;
    }

    const metrics = calculateFieldMetrics(currentPath);
    const field: FieldBoundary = {
      id: selectedField?.id || `field-${Date.now()}`,
      name: fieldName,
      coordinates: currentPath,
      area: metrics.area,
      perimeter: metrics.perimeter,
    };

    if (selectedField) {
      onFieldUpdate?.(selectedField.id, field);
    } else {
      onFieldSave?.(field);
    }

    // Reset form
    setFieldName('');
    setCurrentPath([]);
    setSelectedField(null);

    toast({
      title: 'Field Saved',
      description: `Field "${field.name}" has been saved successfully.`,
    });
  }, [
    fieldName,
    currentPath,
    selectedField,
    calculateFieldMetrics,
    onFieldSave,
    onFieldUpdate,
    toast,
  ]);

  // Load existing field for editing
  const loadField = useCallback((field: FieldBoundary) => {
    setSelectedField(field);
    setFieldName(field.name);
    setCurrentPath(field.coordinates);
  }, []);

  // Clear current field
  const clearField = useCallback(() => {
    setFieldName('');
    setCurrentPath([]);
    setSelectedField(null);
  }, []);

  // Get distance between two GPS coordinates
  const getDistance = (coord1: GPSCoordinate, coord2: GPSCoordinate): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Get GPS error message
  const getErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return 'Location access denied by user.';
      case 2:
        return 'Location information unavailable.';
      case 3:
        return 'Location request timed out.';
      default:
        return 'Unknown GPS error.';
    }
  };

  // Get accuracy color
  const getAccuracyColor = (acc: number | null): string => {
    if (!acc) return 'text-gray-500';
    if (acc <= 10) return 'text-green-600';
    if (acc <= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get accuracy label
  const getAccuracyLabel = (acc: number | null): string => {
    if (!acc) return 'Unknown';
    if (acc <= 10) return 'Excellent';
    if (acc <= 25) return 'Good';
    if (acc <= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GPS Field Mapper</h2>
          <p className="text-gray-600 mt-1">
            Use GPS to map and define field boundaries with precision
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={permissionStatus === 'granted' ? 'default' : 'destructive'}>
            GPS: {permissionStatus}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPS Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                GPS Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">GPS Status</span>
                <Badge variant={isTracking ? 'default' : 'secondary'}>
                  {isTracking ? 'Tracking' : 'Idle'}
                </Badge>
              </div>

              <div className="space-y-2">
                <Button onClick={getCurrentPosition} className="w-full" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Get Current Position
                </Button>

                <Button
                  onClick={isTracking ? stopTracking : startTracking}
                  className="w-full"
                  variant={isTracking ? 'destructive' : 'default'}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </Button>
              </div>

              {currentPosition && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Latitude:</span>{' '}
                    {currentPosition.latitude.toFixed(6)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Longitude:</span>{' '}
                    {currentPosition.longitude.toFixed(6)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Accuracy:</span>{' '}
                    <span className={getAccuracyColor(accuracy)}>
                      {accuracy ? `${accuracy.toFixed(1)}m` : 'Unknown'} (
                      {getAccuracyLabel(accuracy)})
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Definition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Field Definition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="field-name">Field Name</Label>
                <Input
                  id="field-name"
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  placeholder="Enter field name"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Boundary Points</span>
                <Badge variant="outline">{currentPath.length} points</Badge>
              </div>

              <Button
                onClick={addToBoundary}
                disabled={!currentPosition}
                className="w-full"
                variant="outline"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Add Current Position
              </Button>

              {currentPath.length >= 3 && (
                <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Estimated Area:</span>{' '}
                    {calculateFieldMetrics(currentPath).area.toFixed(2)} ha
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Perimeter:</span>{' '}
                    {calculateFieldMetrics(currentPath).perimeter.toFixed(0)} m
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={saveField}
                  disabled={currentPath.length < 3 || !fieldName.trim()}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Field
                </Button>
                <Button onClick={clearField} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Fields */}
          {existingFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {existingFields.map(field => (
                    <button
                      key={field.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 w-full text-left"
                      onClick={() => loadField(field)}
                    >
                      <div>
                        <div className="font-medium text-sm">{field.name}</div>
                        <div className="text-xs text-gray-600">
                          {field.coordinates.length} points • {field.area?.toFixed(2)} ha
                        </div>
                      </div>
                      <Badge variant="outline">Edit</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Field Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={mapRef}
                className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center relative"
              >
                {currentPosition ? (
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <div className="text-sm text-gray-600">
                      Current Position: {currentPosition.latitude.toFixed(4)},{' '}
                      {currentPosition.longitude.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Accuracy: {accuracy ? `${accuracy.toFixed(1)}m` : 'Unknown'}
                    </div>

                    {/* Field boundary visualization would go here */}
                    {currentPath.length > 0 && (
                      <div className="mt-4 p-3 bg-white rounded shadow">
                        <div className="text-sm font-medium mb-2">Field Boundary Points:</div>
                        <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                          {currentPath.map((point, index) => (
                            <div key={index}>
                              Point {index + 1}: {point.latitude.toFixed(4)},{' '}
                              {point.longitude.toFixed(4)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-lg font-medium text-gray-600 mb-2">
                      GPS Position Required
                    </div>
                    <div className="text-sm text-gray-500">
                      Click &quot;Get Current Position&quot; to start mapping your fields
                    </div>
                  </div>
                )}
              </div>

              {permissionStatus === 'denied' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div className="text-sm text-yellow-800">
                      GPS permission is denied. Please enable location access in your browser
                      settings.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default GPSFieldMapper;
