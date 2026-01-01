import { MapPin, Maximize2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { Field } from '../../api';

interface FieldMapProps {
  fields: Field[];
  selectedFieldId: string | null;
  onSelectField: (field: Field) => void;
}

export function FieldMap({ fields, selectedFieldId, onSelectField }: FieldMapProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
        {/* Placeholder Map Background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="text-center z-10 px-4">
          <MapPin className="h-12 w-12 text-green-600 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-semibold text-gray-900">Interactive Field Map</h3>
          <p className="text-gray-500 max-w-md mx-auto mt-2">
            Geospatial mapping and boundary editing features are coming in the next release.
            Currently tracking {fields.length} field locations.
          </p>
        </div>

        {/* Simulated Field Markers */}
        {fields.map((field, index) => {
          // Generate pseudo-random positions for demo purposes
          const top = `${20 + ((index * 15) % 60)}%`;
          const left = `${20 + ((index * 25) % 60)}%`;

          return (
            <button
              key={field.id}
              onClick={() => onSelectField(field)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 ${
                selectedFieldId === field.id.toString() ? 'scale-125 z-20' : 'hover:scale-110 z-10'
              }`}
              style={{ top, left }}
            >
              <div className={`relative flex flex-col items-center`}>
                <div
                  className={`
                    p-2 rounded-full shadow-lg border-2 
                    ${
                      selectedFieldId === field.id.toString()
                        ? 'bg-green-600 border-white text-white'
                        : 'bg-white border-green-600 text-green-600'
                    }
                 `}
                >
                  <LeafIcon className="h-5 w-5" />
                </div>
                <div
                  className={`
                    mt-2 px-2 py-1 bg-white rounded shadow-md text-xs font-medium whitespace-nowrap
                    ${selectedFieldId === field.id.toString() ? 'visible' : 'invisible group-hover:visible'}
                 `}
                >
                  {field.name}
                </div>
              </div>
            </button>
          );
        })}

        <button className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors">
          <Maximize2 className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      <CardContent className="py-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Map Provider: OpenStreetMap (Demo)</span>
          <span>{fields.length} Active Fields</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
