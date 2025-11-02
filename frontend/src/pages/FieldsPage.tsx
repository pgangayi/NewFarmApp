import { useQuery } from '@tanstack/react-query';
import Map from '../components/Map';

interface Field {
  id: string;
  farm_id: string;
  name: string;
  crop_type?: string;
  area_hectares: number;
  created_at: string;
}

export function FieldsPage() {
  const { data: fields, isLoading, error } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      const response = await fetch('/api/fields', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json() as Promise<Field[]>;
    }
  });

  if (isLoading) return <div>Loading fields...</div>;
  if (error) return <div>Error loading fields: {error.message}</div>;

  return (
    <div className="fields-page">
      <h1>Fields</h1>
      <Map />
      <div className="fields-list">
        {fields?.map((field) => (
          <div key={field.id} className="field-card">
            <h2>{field.name}</h2>
            {field.crop_type && <p>Crop: {field.crop_type}</p>}
            <p>{field.area_hectares} hectares</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FieldsPage;