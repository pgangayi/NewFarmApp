import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Sprout,
  CheckSquare,
  Package,
  Users,
  Tractor,
  DollarSign,
  TrendingUp,
  BarChart3,
  Database,
  Wifi,
  Smartphone,
  Leaf,
  Heart,
  Settings,
  Download,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tractor className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Farmers Boot</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to Farmers Boot</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          A comprehensive farm management platform designed to streamline your agricultural
          operations. Manage farms, fields, animals, crops, tasks, inventory, and finances all in
          one place.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-lg"
          >
            Get Started Free
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gray-400 font-medium text-lg"
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Complete Farm Management Solution for Farmers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Farm Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Farm Management</h3>
            <p className="text-gray-600">
              Organize and monitor multiple farms with detailed mapping, location tracking, and
              comprehensive farm data management.
            </p>
          </div>

          {/* Field Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Field Management</h3>
            <p className="text-gray-600">
              Track field details, soil analysis, crop planning, irrigation systems, and
              field-specific activities with precision.
            </p>
          </div>

          {/* Animal Tracking */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Livestock Management</h3>
            <p className="text-gray-600">
              Keep detailed records of your livestock, health treatments, breeding cycles, pedigree
              tracking, and production monitoring.
            </p>
          </div>

          {/* Crop Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Sprout className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Crop Management</h3>
            <p className="text-gray-600">
              Plan crop cycles, track growth stages, manage activities, record observations, and
              monitor yields for optimal productivity.
            </p>
          </div>

          {/* Task Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <CheckSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Task Management</h3>
            <p className="text-gray-600">
              Schedule and track farm tasks, assign responsibilities, monitor progress, and ensure
              timely completion of agricultural activities.
            </p>
          </div>

          {/* Inventory Control */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Inventory Control</h3>
            <p className="text-gray-600">
              Track supplies, equipment, and resources with real-time inventory management, low
              stock alerts, and automated reorder points.
            </p>
          </div>

          {/* Financial Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Financial Management</h3>
            <p className="text-gray-600">
              Track income, expenses, budgets, and profitability with comprehensive financial
              reporting and analytics tools.
            </p>
          </div>

          {/* Data Import/Export */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Data Import/Export</h3>
            <p className="text-gray-600">
              Seamlessly import data from CSV files with intelligent field mapping, validation, and
              export capabilities for easy data management.
            </p>
          </div>

          {/* Team Collaboration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
            <p className="text-gray-600">
              Coordinate with your team, assign roles, manage permissions, and work together
              efficiently on farm operations.
            </p>
          </div>

          {/* Offline Support */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Wifi className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Offline Support</h3>
            <p className="text-gray-600">
              Work seamlessly even without internet connection with our PWA technology. Sync data
              when connection is restored.
            </p>
          </div>

          {/* Mobile Ready */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Optimized</h3>
            <p className="text-gray-600">
              Access your farm data from anywhere with our responsive design. Works perfectly on
              tablets and smartphones.
            </p>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Reports</h3>
            <p className="text-gray-600">
              Get insights into your farm operations with detailed analytics, customizable reports,
              and data-driven decision making.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Farmers Boot?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Data Migration</h3>
              <p className="text-gray-600">
                Import your existing data seamlessly with our smart CSV import system that
                automatically maps fields and validates data.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Boost Productivity</h3>
              <p className="text-gray-600">
                Streamline your workflows with intelligent task management, automated reminders, and
                efficient resource allocation.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customizable & Flexible</h3>
              <p className="text-gray-600">
                Adapt the system to your specific farming needs with customizable fields, workflows,
                and reporting options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Transform Your Farm Management?
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Join thousands of farmers who have already streamlined their operations with Farmers Boot.
        </p>
        <button
          onClick={() => navigate('/signup')}
          className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-lg"
        >
          Get Started Today
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Tractor className="h-6 w-6 text-green-600" />
                <span className="text-lg font-bold text-gray-900">Farmers Boot</span>
              </div>
              <p className="text-gray-600">
                Comprehensive farm management solution for modern agriculture.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2 text-gray-600">
                <li>Farm & Field Management</li>
                <li>Livestock Tracking</li>
                <li>Crop Management</li>
                <li>Financial Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Support</li>
                <li>Community Forum</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2025 Farmers Boot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
