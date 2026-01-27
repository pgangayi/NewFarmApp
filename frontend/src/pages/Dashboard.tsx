import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud,
  Calendar as CalendarIcon,
  Bell,
  Settings,
  Plus,
  Sprout,
  Activity,
  Package,
  DollarSign,
  Clock,
  Menu,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Loader2,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { useFarms } from '../hooks';
import { useCrops, useAnimals, useInventory, useTasks, useFinance } from '../hooks';
import EnhancedFarmCalendar from '../components/EnhancedFarmCalendar';
import WeatherCalendar from '../components/WeatherCalendar';
import WeatherAnalytics from '../components/WeatherAnalytics';
import ErrorBoundary from '../components/ErrorBoundary';
import CropCard from '../components/dashboard/CropCard';
import StatCard from '../components/dashboard/StatCard';
import type { ColorVariant, TabConfig, BackgroundImageState } from '../types/dashboard';
import type { Crop, Animal, Task, InventoryItem, Farm } from '../api';
import {
  colorClasses,
  formatStatus,
  getStatusBadgeClasses,
  getPriorityBadgeClasses,
  formatDate,
  isDateValid,
  isOverdue,
  loadBackgroundImage,
  trapFocus,
  getSelectedFarm,
  logger,
} from '../utils/dashboard';

const TEXT_GREEN_600 = 'text-green-600';
const TEXT_RED_600 = 'text-red-600';
const TEXT_BLUE_600 = 'text-blue-600';
const TEXT_GRAY_600 = 'text-gray-600';
const TEXT_GRAY_600_MB_4 = 'text-gray-600 mb-4';

const TAB_OVERVIEW = 'overview';

// Constants
const RECENT_ACTIVITIES_LIMIT = 3;
const BACKGROUND_IMAGE_URL = '/lockscreen-wallpaper.jpg'; // Renamed without spaces

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(TAB_OVERVIEW);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [farmSelectorOpen, setFarmSelectorOpen] = useState<boolean>(false);
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [cropType, setCropType] = useState<string>('wheat');
  const [backgroundImageState, setBackgroundImageState] = useState<BackgroundImageState>({
    loaded: false,
    error: false,
    url: BACKGROUND_IMAGE_URL,
  });
  const farmSelectorRef = useRef<HTMLDivElement>(null);

  // Live data hooks
  const { data: farms = [], isLoading: farmsLoading, error: farmsError } = useFarms();
  const { data: crops = [], isLoading: cropsLoading, error: cropsError } = useCrops();
  const { data: animals = [], isLoading: animalsLoading, error: animalsError } = useAnimals();
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useInventory();
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const {
    data: financeEntries = [],
    isLoading: financeLoading,
    error: financeError,
  } = useFinance();

  // Load background image
  useEffect(() => {
    loadBackgroundImage(BACKGROUND_IMAGE_URL)
      .then(loaded => setBackgroundImageState(prev => ({ ...prev, loaded, error: !loaded })))
      .catch(() => setBackgroundImageState(prev => ({ ...prev, error: true })));
  }, []);

  // Set default selected farm when farms are loaded
  useEffect(() => {
    if (farms.length > 0 && !selectedFarm) {
      setSelectedFarm(farms[0]?.id || '');
    }
  }, [farms, selectedFarm]);

  // Enhanced farm data with proper fallback handling
  const farmData = useMemo(() => {
    return getSelectedFarm<Farm>(farms, selectedFarm);
  }, [farms, selectedFarm]);

  // Focus management for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (farmSelectorOpen && farmSelectorRef.current) {
        trapFocus(farmSelectorRef.current, event);
      }
    };

    if (farmSelectorOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Move focus to first element in dropdown
      setTimeout(() => {
        const firstFocusable = farmSelectorRef.current?.querySelector(
          '[tabindex="0"]'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [farmSelectorOpen]);

  // Loading states
  const isLoading = useMemo(
    () =>
      farmsLoading ||
      cropsLoading ||
      animalsLoading ||
      inventoryLoading ||
      tasksLoading ||
      financeLoading,
    [farmsLoading, cropsLoading, animalsLoading, inventoryLoading, tasksLoading, financeLoading]
  );

  // Error states
  const hasError = useMemo(
    () => farmsError || cropsError || animalsError || inventoryError || tasksError || financeError,
    [farmsError, cropsError, animalsError, inventoryError, tasksError, financeError]
  );

  // Enhanced stats with proper type handling
  const cropStats = useMemo(
    () => ({
      total: crops.length,
      active: crops.filter((c: Crop) => c.status === 'growing').length,
      healthy: crops.filter((c: Crop) => c.health_status === 'healthy').length,
      needsAttention: crops.filter((c: Crop) => c.health_status !== 'healthy').length,
    }),
    [crops]
  );

  const animalStats = useMemo(
    () => ({
      total: animals.length,
      active: animals.filter((a: Animal) => a.status === 'active').length,
      sold: animals.filter((a: Animal) => a.status === 'sold').length,
      deceased: animals.filter((a: Animal) => a.status === 'deceased').length,
    }),
    [animals]
  );

  const inventoryStats = useMemo(
    () => ({
      total: inventory.length,
      lowStock: inventory.filter(
        (i: InventoryItem) => i.reorder_level && i.quantity < i.reorder_level
      ).length,
      totalValue: inventory.reduce(
        (sum: number, item: InventoryItem) => sum + item.quantity * (item.cost_per_unit || 0),
        0
      ),
    }),
    [inventory]
  );

  // Fixed date validation using proper isNaN checks
  const taskStats = useMemo(
    () => ({
      pending: tasks.filter((t: Task) => t.status === 'pending').length,
      overdue: tasks.filter((t: Task) => {
        return !isDateValid(t.due_date) ? false : isOverdue(t.due_date, t.status);
      }).length,
      inProgress: tasks.filter((t: Task) => t.status === 'in_progress').length,
    }),
    [tasks]
  );

  const financeStats = useMemo(
    () => ({
      income: financeEntries
        .filter((f: any) => f.type === 'income' || f.entry_type === 'income')
        .reduce((sum: number, f: any) => sum + Math.abs(f.amount), 0),
      expenses: financeEntries
        .filter((f: any) => f.type === 'expense' || f.entry_type === 'expense')
        .reduce((sum: number, f: any) => sum + Math.abs(f.amount), 0),
      netBalance: financeEntries.reduce((sum: number, f: any) => sum + f.amount, 0),
    }),
    [financeEntries]
  );

  // Keyboard navigation handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFarmSelectorOpen(false);
        setMobileMenuOpen(false);
      }
    };

    if (farmSelectorOpen || mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }

    return undefined;
  }, [farmSelectorOpen, mobileMenuOpen]);

  // Memoized tab configuration
  const tabs: TabConfig[] = useMemo(
    () => [
      { id: TAB_OVERVIEW, label: 'Overview', icon: Activity },
      { id: 'crops', label: 'Crops', icon: Sprout, count: cropStats.total },
      { id: 'animals', label: 'Animals', icon: Activity, count: animalStats.active },
      { id: 'tasks', label: 'Tasks', icon: CalendarIcon, count: taskStats.pending },
      { id: 'weather', label: 'Weather Calendar', icon: Cloud },
    ],
    [cropStats.total, animalStats.active, taskStats.pending]
  );

  // Handlers with proper cleanup
  const handleFarmSelect = useCallback((farmId: string) => {
    setSelectedFarm(farmId);
    setFarmSelectorOpen(false);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  }, []);

  // Event handlers - removed console.logs for production
  const handleEventClick = useCallback((event: unknown) => {
    // Use logger utility for development logging
    logger.debug('Event clicked:', event);
  }, []);

  const handleCreateEvent = useCallback((date: string) => {
    // EnhancedFarmCalendar passes ISO date strings; parse if needed
    logger.debug('Create event for:', date);
  }, []);

  const handleOperationClick = useCallback((operationId: string) => {
    logger.debug('Operation clicked:', operationId);
  }, []);

  // Loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading your farm dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className={TEXT_GRAY_600_MB_4}>
            We&apos;re having trouble loading your dashboard data. Please check your connection and
            try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full"
            >
              Retry Loading Data
            </button>
          </div>
          <div className="mt-4 p-3 bg-red-50 rounded-lg text-left">
            <p className="text-xs text-red-700 font-medium">Error Details:</p>
            <p className="text-xs text-red-600 mt-1">
              Data loading error - please check your connection
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No farms available
  if (farms.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Sprout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to Your Farm Dashboard
          </h2>
          <p className={TEXT_GRAY_600_MB_4}>
            You don&apos;t have any farms yet. Create your first farm to get started with crop
            management, animal tracking, and more.
          </p>
          <button
            onClick={() => navigate('/farms')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Farm</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        className="min-h-screen bg-linear-to-br from-gray-50 via-green-50 to-blue-50 bg-cover bg-center bg-fixed relative"
        style={
          backgroundImageState.loaded
            ? {
                backgroundImage: `url('${BACKGROUND_IMAGE_URL}')`,
                backgroundBlendMode: 'overlay',
              }
            : {}
        }
      >
        {/* Wallpaper overlay for better readability */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[0.5px]"></div>

        {/* Modern Mobile Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle mobile menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                    {farmData?.name || 'Select Farm'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                    {farmData?.location || 'Farm Location'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative" ref={farmSelectorRef}>
                  <button
                    onClick={() => setFarmSelectorOpen(!farmSelectorOpen)}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Select farm"
                    aria-expanded={farmSelectorOpen}
                    aria-haspopup="menu"
                    tabIndex={0}
                  >
                    <Sprout className="h-5 w-5 text-green-600" />
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">
                      {farmData?.name || 'Select Farm'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {farmSelectorOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setFarmSelectorOpen(false)}
                        aria-hidden="true"
                      ></div>
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div role="listbox" aria-label="Farm selection">
                          {farms.map(farm => (
                            <button
                              key={farm.id}
                              onClick={() => handleFarmSelect(farm.id)}
                              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                selectedFarm === farm.id ? 'bg-green-50' : ''
                              }`}
                              role="option"
                              aria-selected={selectedFarm === farm.id}
                              tabIndex={0}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`p-2 rounded-lg ${
                                    selectedFarm === farm.id ? 'bg-green-100' : 'bg-gray-100'
                                  }`}
                                >
                                  <Sprout
                                    className={`h-4 w-4 ${
                                      selectedFarm === farm.id ? TEXT_GREEN_600 : TEXT_GRAY_600
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium truncate ${
                                      selectedFarm === farm.id ? 'text-green-900' : 'text-gray-900'
                                    }`}
                                  >
                                    {farm.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{farm.location}</p>
                                </div>
                                {selectedFarm === farm.id && (
                                  <CheckCircle className={`h-4 w-4 ${TEXT_GREEN_600} shrink-0`} />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <button
                            onClick={() => {
                              setFarmSelectorOpen(false);
                              navigate('/farms');
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors flex items-center space-x-2"
                            tabIndex={0}
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add New Farm</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-gray-700" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 bg-white">
              <nav className="px-4 py-3 space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <tab.icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.count !== undefined && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:block border-t border-gray-200">
            <nav className="flex space-x-1 px-4 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? `border-green-500 ${TEXT_GREEN_600}`
                      : `border-transparent ${TEXT_GRAY_600} hover:text-gray-900 hover:border-gray-300`
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {activeTab === TAB_OVERVIEW && (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  icon={Sprout}
                  label="Crops"
                  value={cropStats.total}
                  sublabel={`${cropStats.active} active`}
                  color="green"
                  onClick={() => setActiveTab('crops')}
                />
                <StatCard
                  icon={Activity}
                  label="Animals"
                  value={animalStats.total}
                  sublabel={`${animalStats.active} active`}
                  color="blue"
                  onClick={() => setActiveTab('animals')}
                />
                <StatCard
                  icon={Package}
                  label="Inventory"
                  value={inventoryStats.total}
                  sublabel={`${inventoryStats.lowStock} low stock`}
                  color="orange"
                  onClick={() => navigate('/inventory')}
                />
                <StatCard
                  icon={CalendarIcon}
                  label="Tasks"
                  value={taskStats.pending}
                  sublabel={`${taskStats.overdue} overdue`}
                  color="purple"
                  onClick={() => setActiveTab('tasks')}
                />
              </div>

              {/* Finance Overview Card */}
              <div className="bg-linear-to-br from-emerald-500 to-green-600 rounded-xl p-5 sm:p-6 shadow-lg text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold">Financial Overview</h3>
                  <DollarSign className="h-6 w-6 opacity-80" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-emerald-100 text-xs sm:text-sm">Income</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">
                      ${financeStats.income.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-xs sm:text-sm">Expenses</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">
                      ${financeStats.expenses.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-xs sm:text-sm">Balance</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">
                      ${financeStats.netBalance.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Recent Activities
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {tasks.slice(0, RECENT_ACTIVITIES_LIMIT).map((task: Task) => (
                    <div
                      key={task.id}
                      className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div
                            className={`p-2 rounded-lg ${
                              task.priority === 'urgent' ? 'bg-red-50' : 'bg-blue-50'
                            }`}
                          >
                            <CalendarIcon
                              className={`h-4 w-4 ${
                                task.priority === 'urgent' ? TEXT_RED_600 : TEXT_BLUE_600
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {task.title}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Due: {formatDate(task.due_date)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="px-4 sm:px-6 py-8 text-center">
                      <CalendarIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No tasks yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Plus, label: 'Add Crop', color: 'green' as ColorVariant },
                  { icon: Activity, label: 'Log Activity', color: 'blue' as ColorVariant },
                  { icon: Package, label: 'Update Stock', color: 'orange' as ColorVariant },
                  { icon: DollarSign, label: 'Add Transaction', color: 'emerald' as ColorVariant },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95 flex flex-col items-center space-y-2"
                  >
                    <div className={`p-3 rounded-full ${colorClasses[action.color].bg}`}>
                      <action.icon className={`h-5 w-5 ${colorClasses[action.color].icon}`} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'crops' && (
            <>
              {/* Crops Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Crop Management</h2>
                <button className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add Crop</span>
                </button>
              </div>

              {/* Crop Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Total" value={cropStats.total} icon={Sprout} color="green" />
                <StatCard label="Active" value={cropStats.active} icon={Activity} color="blue" />
                <StatCard
                  label="Healthy"
                  value={cropStats.healthy}
                  icon={CheckCircle}
                  color="emerald"
                />
                <StatCard
                  label="Alert"
                  value={cropStats.needsAttention}
                  icon={AlertCircle}
                  color="amber"
                />
              </div>

              {/* Crops List */}
              <div className="space-y-3">
                {crops.map(crop => (
                  <CropCard
                    key={crop.id}
                    crop={crop}
                    onViewDetails={() => logger.debug('View crop details:', crop.id)}
                    onAction={() => logger.debug('Crop action:', crop.id)}
                  />
                ))}
                {crops.length === 0 && (
                  <div className="text-center py-12">
                    <Sprout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Crops Yet</h3>
                    <p className={TEXT_GRAY_600_MB_4}>
                      Start tracking your crops to monitor growth and health
                    </p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto">
                      <Plus className="h-4 w-4" />
                      <span>Add Your First Crop</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'animals' && (
            <>
              {/* Animals Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Animal Management</h2>
                <button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add Animal</span>
                </button>
              </div>

              {/* Animal Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Total" value={animalStats.total} icon={Activity} color="blue" />
                <StatCard
                  label="Active"
                  value={animalStats.active}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard label="Sold" value={animalStats.sold} icon={DollarSign} color="orange" />
                <StatCard
                  label="Deceased"
                  value={animalStats.deceased}
                  icon={AlertCircle}
                  color="red"
                />
              </div>

              {/* Animals List */}
              <div className="space-y-3">
                {animals.map(animal => (
                  <div
                    key={animal.id}
                    className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {animal.identification_tag || animal.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">{animal.species}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(animal.status, 'animal')}`}
                      >
                        {formatStatus(animal.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-500">Breed:</span>
                        <p className="font-medium text-gray-900">
                          {animal.breed || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Acquired:</span>
                        <p className="font-medium text-gray-900">
                          {formatDate(animal.acquisition_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                        View Details
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        aria-label="Activity Log"
                      >
                        <Activity className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {animals.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Animals Yet</h3>
                    <p className={TEXT_GRAY_600_MB_4}>
                      Start tracking your livestock to monitor health and production
                    </p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto">
                      <Plus className="h-4 w-4" />
                      <span>Add Your First Animal</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'weather' && (
            <div className="space-y-6">
              {/* Weather Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Weather & Calendar</h2>
                <div className="flex space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Update Location</span>
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>

              {/* Dynamic crop type selection */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <label
                  htmlFor="crop-type-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Crop Type for Analytics:
                </label>
                <select
                  id="crop-type-select"
                  value={cropType}
                  onChange={e => setCropType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="wheat">Wheat</option>
                  <option value="corn">Corn</option>
                  <option value="soybean">Soybean</option>
                  <option value="rice">Rice</option>
                </select>
              </div>

              {/* Weather Analytics with dynamic crop type */}
              {farmData && <WeatherAnalytics farmId={farmData.id} cropType={cropType} />}

              {/* Enhanced Farm Calendar */}
              {farmData && (
                <ErrorBoundary>
                  <EnhancedFarmCalendar
                    farmId={farmData.id}
                    onEventClick={handleEventClick}
                    onCreateEvent={handleCreateEvent}
                  />
                </ErrorBoundary>
              )}

              {/* Weather Calendar */}
              {farmData && (
                <ErrorBoundary>
                  <WeatherCalendar
                    farmId={farmData.id}
                    operations={tasks.map((task: Task) => ({
                      id: task.id,
                      title: task.title,
                      scheduled_date: task.due_date,
                      type: task.task_type,
                      status: task.status,
                    }))}
                    onOperationClick={handleOperationClick}
                  />
                </ErrorBoundary>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <>
              {/* Tasks Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Task Management</h2>
                <button className="bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Pending" value={taskStats.pending} icon={Clock} color="yellow" />
                <StatCard
                  label="In Progress"
                  value={taskStats.inProgress}
                  icon={Activity}
                  color="blue"
                />
                <StatCard
                  label="Overdue"
                  value={taskStats.overdue}
                  icon={AlertCircle}
                  color="red"
                />
                <StatCard label="Total" value={tasks.length} icon={CheckCircle} color="green" />
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasks.map((task: Task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            task.priority === 'urgent'
                              ? 'bg-red-50'
                              : task.priority === 'high'
                                ? 'bg-orange-50'
                                : task.priority === 'normal'
                                  ? 'bg-blue-50'
                                  : 'bg-gray-50'
                          }`}
                        >
                          <CalendarIcon
                            className={`h-4 w-4 ${
                              task.priority === 'urgent'
                                ? 'text-red-600'
                                : task.priority === 'high'
                                  ? 'text-orange-600'
                                  : task.priority === 'normal'
                                    ? TEXT_BLUE_600
                                    : TEXT_GRAY_600
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-600">{task.task_type}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(task.status, 'task')}`}
                      >
                        {formatStatus(task.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-500">Due:</span>
                        <p
                          className={`font-medium ${
                            isOverdue(task.due_date, task.status) ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {formatDate(task.due_date)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <p className={`font-medium ${getPriorityBadgeClasses(task.priority)}`}>
                          {formatStatus(task.priority)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                        View Details
                      </button>
                      <button
                        className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                        aria-label="View History"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
                    <p className={TEXT_GRAY_600_MB_4}>
                      Create your first task to start organizing your farm work
                    </p>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto">
                      <Plus className="h-4 w-4" />
                      <span>Create Your First Task</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                  activeTab === tab.id ? `bg-green-50 ${TEXT_GREEN_600}` : TEXT_GRAY_600
                }`}
              >
                <div className="relative">
                  <tab.icon className="h-5 w-5" />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.count > 9 ? '9+' : tab.count}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium mt-1">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Spacing for mobile bottom nav */}
        <div className="lg:hidden h-20"></div>
      </div>
    </ErrorBoundary>
  );
}
