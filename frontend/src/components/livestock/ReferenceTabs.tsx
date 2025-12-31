import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useDiseases, useBreeds, useGrowthStandards, useFeedItems } from '../../api';

export function HealthReference() {
  const { data: diseases = [] } = useDiseases();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Disease & Treatment Database</CardTitle>
      </CardHeader>
      <CardContent>
        {diseases.length === 0 ? (
          <p className="text-gray-500">No disease records found.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diseases.map(d => (
              <li key={d.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="font-bold text-red-600">{d.name}</div>
                {/* Fixed property name from common_name to name based on types */}
                <p className="text-sm mt-2">{d.symptoms?.join(', ')}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function BreedsRepository() {
  const { data: breeds = [] } = useBreeds();
  const { data: standards = [] } = useGrowthStandards('');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Breeds Library</CardTitle>
            <CardDescription>Manage and view breed characteristics.</CardDescription>
          </CardHeader>
          <CardContent>
            {breeds.length === 0 ? (
              <p className="text-gray-500">No breeds configured.</p>
            ) : (
              <ul className="space-y-4">
                {breeds.map(b => (
                  <li key={b.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-sm text-gray-500">
                      {b.species} - {b.characteristics?.join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Growth Standards</CardTitle>
            <CardDescription>Benchmark weights and yield.</CardDescription>
          </CardHeader>
          <CardContent>
            {standards.length === 0 ? (
              <p className="text-gray-500">No growth standards available.</p>
            ) : (
              <p>Standards loaded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function FeedManagement() {
  const { data: feed = [] } = useFeedItems();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feed & Nutrition</CardTitle>
      </CardHeader>
      <CardContent>
        {feed.length === 0 ? (
          <p className="text-gray-500">No feed items found.</p>
        ) : (
          <ul className="space-y-2">
            {feed.map(f => (
              <li key={f.id}>
                {f.name} ({f.category})
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
