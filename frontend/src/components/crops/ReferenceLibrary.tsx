import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'; // Assuming you have these or using custom tabs
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useStrains, useChemicals, usePlantingGuides, usePestIdentifiers } from '../../api';

// Sub-components
function StrainsList() {
  const { data: strains = [] } = useStrains();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {strains.length === 0 ? <p className="text-gray-500">No strains found.</p> : null}
      {strains.map(s => (
        <Card key={s.id}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
            <CardDescription>{s.crop_type}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">
            {s.days_to_maturity} days to maturity
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChemicalsList() {
  const { data: chemicals = [] } = useChemicals();
  return (
    <div className="space-y-4">
      {chemicals.length === 0 ? <p className="text-gray-500">No chemical records.</p> : null}
      {chemicals.map(c => (
        <div key={c.id} className="p-4 border rounded-lg">
          <div className="flex justify-between">
            <h4 className="font-bold">{c.name}</h4>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{c.type}</span>
          </div>
          <p className="text-sm text-red-600 mt-1">Safety: {c.safety_instructions}</p>
        </div>
      ))}
    </div>
  );
}

function PlantingGuides() {
  const { data: guides = [] } = usePlantingGuides();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planting Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        {guides.length === 0 ? (
          <p className="text-gray-500">No planting guides.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Crop</th>
                <th className="py-2">Region</th>
                <th className="py-2">Window</th>
              </tr>
            </thead>
            <tbody>
              {guides.map(g => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{g.crop_type}</td>
                  <td className="py-2">{g.region}</td>
                  <td className="py-2">
                    {g.planting_window_start} - {g.planting_window_end}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function PestGallery() {
  const { data: pests = [] } = usePestIdentifiers();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {pests.length === 0 ? <p className="text-gray-500 col-span-4">No pest identifiers.</p> : null}
      {pests.map(p => (
        <div key={p.id} className="border rounded-lg p-2 text-center">
          <div className="h-32 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400">
            {/* Use first image or placeholder */}
            {p.images && p.images[0] ? (
              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover rounded" />
            ) : (
              'No Image'
            )}
          </div>
          <p className="font-medium text-sm">{p.name}</p>
          <span className="text-xs text-red-500">{p.type}</span>
        </div>
      ))}
    </div>
  );
}

export function ReferenceLibrary() {
  // Using shadcn/ui Tabs
  return (
    <Tabs defaultValue="strains" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="strains">Strains</TabsTrigger>
        <TabsTrigger value="chemicals">Chemicals</TabsTrigger>
        <TabsTrigger value="planting">Planting</TabsTrigger>
        <TabsTrigger value="pests">Pests</TabsTrigger>
      </TabsList>
      <TabsContent value="strains" className="mt-4">
        <StrainsList />
      </TabsContent>
      <TabsContent value="chemicals" className="mt-4">
        <ChemicalsList />
      </TabsContent>
      <TabsContent value="planting" className="mt-4">
        <PlantingGuides />
      </TabsContent>
      <TabsContent value="pests" className="mt-4">
        <PestGallery />
      </TabsContent>
    </Tabs>
  );
}
