import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { Breadcrumbs } from '../components/Breadcrumbs';

export function QueuePage() {
  const { queueLength, isOnline, conflicts, resolveConflict } = useOfflineQueue();

  const handleResolveConflict = (opId: number, resolution: 'overwrite' | 'discard' | 'merge') => {
    resolveConflict(opId, resolution);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-0" />
        </div>
      </div>

      <div className="queue-page p-6">
        <h1 className="text-2xl font-bold mb-4">Offline Queue</h1>

        <div className="queue-status mb-6">
          <div className="flex items-center gap-4 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <span className="text-gray-600">Queued operations: {queueLength}</span>
          </div>

          {queueLength > 0 && <p className="text-blue-600">Operations will sync when online.</p>}
        </div>

        {conflicts.length > 0 && (
          <div className="conflicts-section">
            <h2 className="text-xl font-semibold mb-4">Conflicts Requiring Resolution</h2>
            <div className="space-y-4">
              {conflicts.map(conflict => (
                <div key={conflict.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium capitalize">{conflict.type.replace('_', ' ')}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(conflict.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-red-600 text-sm">Conflict</span>
                  </div>

                  {conflict.error && <p className="text-red-700 mb-3">{conflict.error}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveConflict(conflict.id!, 'overwrite')}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Retry (Overwrite)
                    </button>
                    <button
                      onClick={() => handleResolveConflict(conflict.id!, 'discard')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Discard
                    </button>
                    {conflict.type.includes('update') && (
                      <button
                        onClick={() => handleResolveConflict(conflict.id!, 'merge')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Merge Changes
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QueuePage;
