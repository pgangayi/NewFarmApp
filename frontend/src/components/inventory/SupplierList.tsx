import { Plus, Truck, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Supplier } from './types';

interface SupplierListProps {
  suppliers: Supplier[];
  onAddSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
}

export function SupplierList({ suppliers, onAddSupplier, onEditSupplier }: SupplierListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Suppliers</h2>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={onAddSupplier}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers?.map(supplier => (
          <Card key={supplier.id}>
            <CardHeader>
              <CardTitle className="text-lg">{supplier.supplier_name}</CardTitle>
              <CardDescription>
                {supplier.contact_person && `Contact: ${supplier.contact_person}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {supplier.contact_phone && (
                  <p className="text-sm text-gray-600">📞 {supplier.contact_phone}</p>
                )}
                {supplier.contact_email && (
                  <p className="text-sm text-gray-600">📧 {supplier.contact_email}</p>
                )}
                {supplier.lead_time_days && (
                  <p className="text-sm text-gray-600">
                    ⏱️ Lead time: {supplier.lead_time_days} days
                  </p>
                )}
                {supplier.reliability_rating && (
                  <p className="text-sm text-gray-600">
                    ⭐ Reliability: {supplier.reliability_rating}/10
                  </p>
                )}
                {supplier.total_orders !== undefined && (
                  <p className="text-sm text-gray-600">
                    📦 Orders: {supplier.completed_orders || 0}/{supplier.total_orders} completed
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge variant={supplier.active ? 'default' : 'secondary'}>
                  {supplier.active ? 'Active' : 'Inactive'}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => onEditSupplier(supplier)}>
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!suppliers || suppliers.length === 0) && (
          <div className="col-span-full text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No suppliers</h4>
            <p className="text-gray-600 mb-4">
              Add suppliers to manage your procurement relationships
            </p>
            <Button onClick={onAddSupplier}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Supplier
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
