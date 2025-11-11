import { useNavigate } from 'react-router-dom';
import { MapPin, Sprout, CheckSquare, Package, Users, Tractor } from 'lucide-react';

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
          operations. Manage farms, fields, animals, tasks, and inventory all in one place.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Farm Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Farm Management</h3>
            <p className="text-gray-600">
              Organize and monitor your farms and fields with detailed mapping and tracking.
            </p>
          </div>

          {/* Animal Tracking */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Sprout className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Animal Tracking</h3>
            <p className="text-gray-600">
              Keep detailed records of your livestock, health treatments, and breeding cycles.
            </p>
          </div>

          {/* Task Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <CheckSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Task Management</h3>
            <p className="text-gray-600">
              Schedule and track farm tasks, assign responsibilities, and monitor progress.
            </p>
          </div>

          {/* Inventory Control */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Inventory Control</h3>
            <p className="text-gray-600">
              Track supplies, equipment, and resources with real-time inventory management.
            </p>
          </div>

          {/* Team Collaboration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
            <p className="text-gray-600">
              Coordinate with your team, assign roles, and manage permissions effectively.
            </p>
          </div>

          {/* Offline Support */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Tractor className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Offline Support</h3>
            <p className="text-gray-600">
              Work seamlessly even without internet connection with our PWA technology.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>&copy; 2025 Farmers Boot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
