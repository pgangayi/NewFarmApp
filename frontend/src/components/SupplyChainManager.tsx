import { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Building,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  // Calendar,
  Download,
  // Upload,
  Plus,
  Search,
  // Filter,
  Eye,
  Edit,
  // Trash2,
  // TruckIcon,
  // MapPin,
  Phone,
  Mail,
  Star,
  Activity,
  Target,
  Lightbulb,
  Zap,
  RefreshCw,
  // Save,
  // X,
  Check,
  // Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const STATUS_COLOR_GRAY = 'text-gray-600 bg-gray-100';
const STATUS_COLOR_RED = 'text-red-600 bg-red-100';

interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  performance_score: number;
  lead_time_days: number;
  payment_terms: string;
  contract_expiry?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
}

interface PurchaseOrder {
  id: string;
  vendor_id: string;
  vendor_name: string;
  order_number: string;
  status: 'draft' | 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  order_date: string;
  expected_delivery: string;
  actual_delivery?: string;
  items: OrderItem[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_date?: string;
}

interface OrderItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  specifications?: string;
}

interface SupplyChainMetrics {
  total_vendors: number;
  active_orders: number;
  pending_deliveries: number;
  monthly_spend: number;
  average_lead_time: number;
  vendor_performance: number;
  cost_savings: number;
  delivery_success_rate: number;
}

export default function SupplyChainManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'vendors' | 'orders' | 'inventory' | 'analytics'
  >('overview');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [metrics, setMetrics] = useState<SupplyChainMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // TODO: Implement API calls to fetch real supply chain data
      // const vendors = await supplyChainService.getVendors();
      // const orders = await supplyChainService.getOrders();
      // const metrics = await supplyChainService.getMetrics();

      setVendors([]);
      setPurchaseOrders([]);
      setMetrics({
        total_vendors: 0,
        active_orders: 0,
        pending_deliveries: 0,
        monthly_spend: 0,
        average_lead_time: 0,
        vendor_performance: 0,
        cost_savings: 0,
        delivery_success_rate: 0,
      });
      setLoading(false);
    };

    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'delivered':
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'shipped':
        return 'text-yellow-600 bg-yellow-100';
      case 'inactive':
      case 'cancelled':
      case 'rejected':
        return STATUS_COLOR_RED;
      case 'draft':
        return STATUS_COLOR_GRAY;
      default:
        return STATUS_COLOR_GRAY;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return STATUS_COLOR_RED;
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return STATUS_COLOR_GRAY;
      default:
        return STATUS_COLOR_GRAY;
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || vendor.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supply chain data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Supply Chain Management</h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive vendor and procurement management
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsAddVendorOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-green-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm border-b mb-8 rounded-lg shadow-sm">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'vendors', label: 'Vendors', icon: Building },
              { key: 'orders', label: 'Purchase Orders', icon: FileText },
              { key: 'inventory', label: 'Inventory', icon: Package },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Active Vendors
                    </CardTitle>
                    <Building className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{metrics.total_vendors}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">All performing well</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Active Orders
                    </CardTitle>
                    <FileText className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{metrics.active_orders}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      {metrics.pending_deliveries} pending delivery
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Monthly Spend
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    ${metrics.monthly_spend.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">12% increase from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
                    <Target className="h-4 w-4 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {metrics.vendor_performance.toFixed(1)}%
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Excellent vendor rating</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Order delivered on time</p>
                        <p className="text-sm text-gray-600">PO-2024-001 from AgriSupply Co.</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Truck className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Order shipped</p>
                        <p className="text-sm text-gray-600">Irrigation controller from FarmTech</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Order pending approval</p>
                        <p className="text-sm text-gray-600">
                          Organic supplies from Organic Solutions
                        </p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Smart Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Bulk Order Opportunity</p>
                          <p className="text-sm text-gray-600">
                            Order 200+ bags of seeds for 15% discount
                          </p>
                          <Badge className="mt-2 bg-blue-100 text-blue-800">Save $3,200</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Performance Optimization</p>
                          <p className="text-sm text-gray-600">
                            Alternative vendor offers 20% faster delivery
                          </p>
                          <Badge className="mt-2 bg-green-100 text-green-800">
                            Efficiency Boost
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Cost Optimization</p>
                          <p className="text-sm text-gray-600">
                            Switch to quarterly orders for better pricing
                          </p>
                          <Badge className="mt-2 bg-purple-100 text-purple-800">
                            $12,500/year savings
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsAddVendorOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map(vendor => (
                <Card
                  key={vendor.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{vendor.name}</CardTitle>
                        <CardDescription>{vendor.category}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(vendor.status)}>{vendor.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{vendor.contact_person}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{vendor.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{vendor.email}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{vendor.rating}</span>
                        </div>
                        <div className="text-sm text-gray-600">{vendor.total_orders} orders</div>
                        <div className="text-sm font-medium text-green-600">
                          ${vendor.total_spent.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toast({
                              title: 'Coming Soon',
                              description:
                                'Vendor details view will be available in the next update.',
                            })
                          }
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toast({
                              title: 'Coming Soon',
                              description: 'Vendor editing will be available in the next update.',
                            })
                          }
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsAddOrderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>

            <div className="space-y-4">
              {filteredOrders.map(order => (
                <Card key={order.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.order_number}
                        </h3>
                        <p className="text-gray-600">{order.vendor_name}</p>
                        <p className="text-sm text-gray-500">
                          Order Date: {order.order_date} • Expected: {order.expected_delivery}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        <Badge className={getStatusColor(order.approval_status)}>
                          {order.approval_status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${order.total_amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Items</p>
                        <p className="text-lg font-semibold">{order.items.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Lead Time</p>
                        <p className="text-lg font-semibold">{order.items[0]?.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="flex items-center gap-1">
                          {order.status === 'delivered' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {order.status === 'shipped' && (
                            <Truck className="h-4 w-4 text-blue-500" />
                          )}
                          {order.status === 'pending' && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm font-medium">{order.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toast({
                                title: 'Coming Soon',
                                description:
                                  'Order details view will be available in the next update.',
                              })
                            }
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toast({
                                title: 'Coming Soon',
                                description: 'PDF download will be available in the next update.',
                              })
                            }
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download PDF
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toast({
                                  title: 'Coming Soon',
                                  description:
                                    'Order editing will be available in the next update.',
                                })
                              }
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          {order.approval_status === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                toast({
                                  title: 'Coming Soon',
                                  description:
                                    'Order approval will be available in the next update.',
                                })
                              }
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && metrics && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Cost Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${metrics.cost_savings.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">This year through optimization</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-500" />
                    Delivery Success
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {metrics.delivery_success_rate}%
                  </div>
                  <p className="text-sm text-gray-600 mt-2">On-time delivery rate</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Avg Lead Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {metrics.average_lead_time} days
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Average delivery time</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-purple-500" />
                    Vendor Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {metrics.vendor_performance.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Overall performance</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and detailed analytics would go here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Spending Trends</CardTitle>
                  <CardDescription>Monthly procurement spending analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Chart visualization would appear here</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Vendor Performance</CardTitle>
                  <CardDescription>Comparative vendor analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Performance metrics visualization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
