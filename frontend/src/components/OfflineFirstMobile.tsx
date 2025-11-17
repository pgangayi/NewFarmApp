import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Download,
  Upload,
  Cloud,
  CloudOff,
  Smartphone,
  Tablet,
  MapPin,
  Camera,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Sync,
  Database,
  FileText,
  Image,
  Map,
  Navigation,
  Battery,
  Signal,
  HardDrive,
  RefreshCw,
  Bell,
  Zap,
  MessageSquare,
  Settings,
  Share,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface OfflineFeature {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'media' | 'navigation' | 'communication' | 'productivity';
  status: 'available' | 'downloading' | 'syncing' | 'completed' | 'error';
  download_progress: number;
  sync_status: 'pending' | 'synced' | 'conflict' | 'error';
  last_updated: string;
  size_mb: number;
  priority: 'low' | 'medium' | 'high';
  auto_sync: boolean;
}

interface MobileCapability {
  feature: string;
  support_level: 'full' | 'partial' | 'none';
  description: string;
  icon: React.ComponentType<unknown>;
}

export default function OfflineFirstMobile() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit] = useState(500); // MB
  const [offlineFeatures, setOfflineFeatures] = useState<OfflineFeature[]>([
    {
      id: 'farm-maps',
      name: 'Farm Maps & GPS',
      description: 'Offline farm field maps, boundary data, and GPS navigation',
      category: 'navigation',
      status: 'available',
      download_progress: 100,
      sync_status: 'synced',
      last_updated: '2024-11-05',
      size_mb: 45,
      priority: 'high',
      auto_sync: true,
    },
    {
      id: 'photo-documentation',
      name: 'Photo Documentation',
      description: 'Capture and store photos offline with GPS metadata',
      category: 'media',
      status: 'available',
      download_progress: 100,
      sync_status: 'synced',
      last_updated: '2024-11-05',
      size_mb: 120,
      priority: 'high',
      auto_sync: true,
    },
    {
      id: 'task-management',
      name: 'Task Management',
      description: 'Complete tasks offline with automatic sync when online',
      category: 'productivity',
      status: 'downloading',
      download_progress: 75,
      sync_status: 'pending',
      last_updated: '2024-11-04',
      size_mb: 8,
      priority: 'high',
      auto_sync: true,
    },
    {
      id: 'crop-data',
      name: 'Crop Database',
      description: 'Complete crop information, varieties, and growing guides',
      category: 'data',
      status: 'available',
      download_progress: 100,
      sync_status: 'synced',
      last_updated: '2024-11-03',
      size_mb: 32,
      priority: 'medium',
      auto_sync: false,
    },
    {
      id: 'weather-data',
      name: 'Weather Forecasts',
      description: 'Offline weather data and historical patterns',
      category: 'data',
      status: 'syncing',
      download_progress: 45,
      sync_status: 'pending',
      last_updated: '2024-11-05',
      size_mb: 15,
      priority: 'medium',
      auto_sync: true,
    },
    {
      id: 'communication',
      name: 'Team Communication',
      description: 'Message center with offline queue and sync',
      category: 'communication',
      status: 'available',
      download_progress: 100,
      sync_status: 'synced',
      last_updated: '2024-11-05',
      size_mb: 5,
      priority: 'low',
      auto_sync: true,
    },
  ]);

  const mobileCapabilities: MobileCapability[] = [
    {
      feature: 'GPS Location Services',
      support_level: 'full',
      description: 'Real-time location tracking and field mapping',
      icon: MapPin,
    },
    {
      feature: 'Camera Integration',
      support_level: 'full',
      description: 'High-quality photo capture with automatic metadata',
      icon: Camera,
    },
    {
      feature: 'Push Notifications',
      support_level: 'full',
      description: 'Instant alerts for critical farm activities',
      icon: Bell,
    },
    {
      feature: 'Offline Storage',
      support_level: 'full',
      description: 'Cache data and media for offline access',
      icon: Database,
    },
    {
      feature: 'Background Sync',
      support_level: 'partial',
      description: 'Automatic data synchronization when online',
      icon: RefreshCw,
    },
    {
      feature: 'File System Access',
      support_level: 'partial',
      description: 'Export and import farm data files',
      icon: FileText,
    },
  ];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate storage usage calculation
    const totalSize = offlineFeatures.reduce((sum, feature) => sum + feature.size_mb, 0);
    setStorageUsed(totalSize);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineFeatures]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'completed':
      case 'synced':
        return 'text-green-600 bg-green-100';
      case 'downloading':
      case 'syncing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'conflict':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSupportLevelColor = (level: string) => {
    switch (level) {
      case 'full':
        return 'text-green-600 bg-green-100';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100';
      case 'none':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const syncAllData = async () => {
    setSyncInProgress(true);

    // Simulate sync process
    setTimeout(() => {
      setOfflineFeatures(prev =>
        prev.map(feature => ({
          ...feature,
          status: 'available' as const,
          sync_status: 'synced' as const,
          last_updated: new Date().toISOString().split('T')[0],
        }))
      );
      setSyncInProgress(false);
    }, 3000);
  };

  const downloadFeature = (featureId: string) => {
    setOfflineFeatures(prev =>
      prev.map(feature =>
        feature.id === featureId
          ? { ...feature, status: 'downloading', download_progress: 0 }
          : feature
      )
    );

    // Simulate download progress
    const interval = setInterval(() => {
      setOfflineFeatures(prev => {
        const updated = prev.map(feature => {
          if (feature.id === featureId && feature.download_progress < 100) {
            const newProgress = Math.min(feature.download_progress + 10, 100);
            return {
              ...feature,
              download_progress: newProgress,
              status: newProgress === 100 ? 'available' : 'downloading',
              last_updated: new Date().toISOString().split('T')[0],
            };
          }
          return feature;
        });

        if (updated.find(f => f.id === featureId)?.download_progress === 100) {
          clearInterval(interval);
        }

        return updated;
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Offline-First Mobile</h1>
                <p className="text-gray-600 mt-1">
                  Full functionality even without internet connection
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <Badge
                className={`${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {isOnline ? (
                  <Wifi className="h-3 w-3 mr-1" />
                ) : (
                  <WifiOff className="h-3 w-3 mr-1" />
                )}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              <Badge variant="outline">
                <Database className="h-3 w-3 mr-1" />
                {storageUsed}MB / {storageLimit}MB
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={syncAllData} disabled={syncInProgress || !isOnline}>
              {syncInProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Sync className="h-4 w-4 mr-2" />
                  Sync All
                </>
              )}
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Network Status & Storage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{isOnline ? 'Connected' : 'Offline'}</div>
              <p className="text-sm text-gray-600">
                {isOnline
                  ? 'All features available with real-time sync'
                  : 'Working offline with cached data'}
              </p>
              <div className="mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Signal className="h-4 w-4 text-gray-400" />
                  <span>Signal: {isOnline ? 'Strong' : 'No connection'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                Storage Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{storageUsed}MB</div>
              <Progress value={(storageUsed / storageLimit) * 100} className="mb-3" />
              <p className="text-sm text-gray-600">
                {Math.round((storageUsed / storageLimit) * 100)}% of {storageLimit}MB used
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Optimal performance</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Sync className="h-5 w-5 text-purple-500" />
                Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {offlineFeatures.filter(f => f.sync_status === 'synced').length}/
                {offlineFeatures.length}
              </div>
              <p className="text-sm text-gray-600">Features synchronized</p>
              <div className="mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Data integrity verified</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Capabilities */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Mobile Device Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mobileCapabilities.map((capability, index) => {
              const IconComponent = capability.icon;
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{capability.feature}</CardTitle>
                          <CardDescription>{capability.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getSupportLevelColor(capability.support_level)}>
                        {capability.support_level}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Offline Features */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Offline Features</h2>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Storage
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {offlineFeatures.map(feature => (
              <Card key={feature.id} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                        <Badge className={getStatusColor(feature.status)}>{feature.status}</Badge>
                        <Badge className={getPriorityColor(feature.priority)}>
                          {feature.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{feature.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Size: {feature.size_mb}MB</span>
                        <span>Updated: {feature.last_updated}</span>
                        <span>Sync: {feature.sync_status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {feature.status === 'downloading' && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            {feature.download_progress}%
                          </div>
                          <Progress value={feature.download_progress} className="w-20" />
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFeature(feature.id)}
                        disabled={feature.status === 'downloading' || feature.status === 'syncing'}
                      >
                        {feature.status === 'downloading' ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Downloading
                          </>
                        ) : feature.status === 'available' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Downloaded
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={feature.auto_sync}
                        className="rounded"
                        readOnly
                      />
                      <span className="text-sm text-gray-600">Auto-sync when online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Offline Actions
            </CardTitle>
            <CardDescription>
              Essential tasks you can perform without internet connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Camera className="h-6 w-6 mb-2" />
                <span>Take Photo</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MapPin className="h-6 w-6 mb-2" />
                <span>Mark Location</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <CheckCircle className="h-6 w-6 mb-2" />
                <span>Complete Task</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span>Add Note</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
