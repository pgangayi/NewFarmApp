import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import GlobalSearch from './GlobalSearch';
import {
  MapPin,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Plus,
  Bell,
  Search,
  Sprout,
  BarChart3,
} from 'lucide-react';

interface Farm {
  id: string;
  name: string;
  location?: string;
}

interface HeaderProps {
  farms?: Farm[];
  currentFarm?: Farm;
  onFarmChange?: (farmId: string) => void;
  onAddCrop?: () => void;
}

export function Header({ farms = [], currentFarm, onFarmChange, onAddCrop }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showFarmDropdown, setShowFarmDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const handleFarmSelect = (farm: Farm) => {
    onFarmChange?.(farm.id);
    setShowFarmDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Farm Selector */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Sprout className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">FarmManager</h1>
                  <p className="text-xs text-gray-500">Professional Farm Management</p>
                </div>
              </div>
            </div>

            {/* Farm Selector */}
            {farms.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowFarmDropdown(!showFarmDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  {currentFarm ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <div>
                          <p className="font-medium">{currentFarm.name}</p>
                          {currentFarm.location && (
                            <p className="text-xs text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {currentFarm.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <span>Select Farm</span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showFarmDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-900">Select Farm</h3>
                      <p className="text-xs text-gray-500">Choose a farm to manage</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {farms.map(farm => (
                        <button
                          key={farm.id}
                          onClick={() => handleFarmSelect(farm)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <div className="bg-green-100 p-2 rounded">
                            <Sprout className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{farm.name}</p>
                            {farm.location && (
                              <p className="text-xs text-gray-500 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {farm.location}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Actions and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowGlobalSearch(true)}>
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
              <Button variant="outline" size="sm" onClick={onAddCrop}>
                <Plus className="h-4 w-4 mr-1" />
                Add Crop
              </Button>
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                Reports
              </Button>
            </div>

            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowGlobalSearch(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-center h-8 w-8 bg-blue-100 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to profile/settings
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay to close dropdowns when clicking outside */}
      {(showFarmDropdown || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFarmDropdown(false);
            setShowUserMenu(false);
          }}
        />
      )}

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        currentFarmId={currentFarm ? parseInt(currentFarm.id) : undefined}
      />
    </header>
  );
}

export default Header;
