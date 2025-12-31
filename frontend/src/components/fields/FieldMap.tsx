import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Field } from '../../api/types';
import { Card } from '../ui/card';

// Ensure token is set
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface FieldMapProps {
  fields: Field[];
  selectedFieldId: string | null;
  onSelectField: (field: Field) => void;
  center?: [number, number];
  zoom?: number;
}

export function FieldMap({
  fields,
  selectedFieldId,
  onSelectField,
  center = [-96, 37.8], // Default to US center, adjustable
  zoom = 3,
}: FieldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!mapboxgl.accessToken) {
      console.warn('Mapbox access token not found');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: center,
      zoom: zoom,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      map.current?.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current?.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Fields Layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: fields
        .filter(f => f.geometry) // Only fields with geometry
        .map(field => ({
          type: 'Feature',
          geometry: field.geometry as any,
          properties: {
            id: field.id,
            name: field.name,
            crop: field.crop_type,
            area: field.area_hectares,
          },
        })),
    };

    const sourceId = 'fields-source';
    const fillLayerId = 'fields-fill';
    const outlineLayerId = 'fields-outline';
    const labelLayerId = 'fields-labels';

    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojsonData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
      });

      // Fill layer
      map.current.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'id'], selectedFieldId || ''],
            '#22c55e', // Green if selected
            '#3b82f6', // Blue default
          ],
          'fill-opacity': 0.4,
        },
      });

      // Outline layer
      map.current.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
        },
      });

      // Labels
      map.current.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', 'name'],
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 0.5,
          'text-justify': 'auto',
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      });

      // Events
      map.current.on('click', fillLayerId, e => {
        if (e.features && e.features[0]) {
          const fieldId = e.features[0].properties?.id;
          const field = fields.find(f => f.id.toString() === fieldId.toString());
          if (field) {
            onSelectField(field);
          }
        }
      });

      map.current.on('mouseenter', fillLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', fillLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }

    // Update selection styling dynamically if source exists
    if (map.current.getLayer(fillLayerId)) {
      map.current.setPaintProperty(fillLayerId, 'fill-color', [
        'case',
        ['==', ['get', 'id'], selectedFieldId || ''],
        '#22c55e',
        '#3b82f6',
      ]);
    }

    // Fit bounds if fields exist
    if (geojsonData.features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      geojsonData.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          (feature.geometry.coordinates as number[][][])[0].forEach(coord => {
            bounds.extend(coord as [number, number]);
          });
        }
      });
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [fields, mapLoaded, selectedFieldId]);

  if (!mapboxgl.accessToken) {
    return (
      <Card className="p-8 text-center text-gray-500 bg-gray-100">
        <p>
          Mapbox access token is missing. Please configure VITE_MAPBOX_TOKEN in your environment.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
