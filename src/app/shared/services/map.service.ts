import { Injectable } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

export const AMBULANCE_ICON = '<svg viewBox="0 -960 960 960" fill="white" width="20" height="20"><path d="M450-810v-150h60v150h-60Zm-187 53L152-869l42-43 112 112-43 43ZM150-40q-12.75 0-21.37-8.63Q120-57.25 120-70v-324l84-244.65q6-18.35 21.5-29.85T261-680h114v-75h153q-23 29-37.5 63T472-620H258l-60 176h323q13 17 29 32.5t34 27.5H180v200h600v-163q16-4 30.92-9.14Q825.83-361.29 840-369v299q0 12.75-8.62 21.37Q822.75-40 810-40h-21q-12.75 0-21.37-8.63Q759-57.25 759-70v-54H200v54q0 12.75-8.62 21.37Q182.75-40 170-40h-20Zm100-214h120q13 0 21.5-8.68 8.5-8.67 8.5-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5H250v60Zm460 0v-60H590q-13 0-21.5 8.68-8.5 8.67-8.5 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5h120ZM180-384v200-200Zm518-126 141-142-28-28-113 114-59-60-28 29 87 87Zm164.5-222.5Q919-676 919-595t-56.5 137.5Q806-401 725-401t-137.5-56.5Q531-514 531-595t56.5-137.5Q644-789 725-789t137.5 56.5Z"/></svg>';

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  title: string;
  subtitle?: string;
  color?: string;
  text?: string;
  iconSvg?: string;
  data?: any;
  pulse?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MapService {
  private maps = new Map<string, mapboxgl.Map>();

  initMap(id: string, container: string | HTMLElement, center: [number, number] = [-63.1825, -17.7833], zoom: number = 12) {
    mapboxgl.accessToken = environment.mapboxToken;
    (mapboxgl as any).config.MAPBOX_EVENTS_URL = '';
    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }));
    this.maps.set(id, map);
    return map;
  }

  getMap(id: string) {
    return this.maps.get(id) ?? null;
  }

  destroyMap(id: string) {
    const map = this.maps.get(id);
    if (map) {
      map.remove();
      this.maps.delete(id);
    }
  }

  flyTo(mapId: string, lng: number, lat: number, zoom: number = 14) {
    this.maps.get(mapId)?.flyTo({ center: [lng, lat], zoom, duration: 1000 });
  }

  addTrafficLayer(map: mapboxgl.Map) {
    if (!map.isStyleLoaded()) return;
    if (map.getLayer('traffic-layer')) return;
    map.addSource('mapbox-traffic', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-traffic-v1',
    });
    map.addLayer({
      id: 'traffic-layer',
      type: 'line',
      source: 'mapbox-traffic',
      'source-layer': 'traffic',
      paint: {
        'line-color': ['match', ['get', 'congestion'],
          'low', '#2dc937', 'moderate', '#e7b416',
          'heavy', '#cc3232', 'severe', '#8b0000', '#888888'],
        'line-width': 3,
        'line-opacity': 0.7,
      },
    });
  }

  removeTrafficLayer(map: mapboxgl.Map) {
    if (map.getLayer('traffic-layer')) map.removeLayer('traffic-layer');
    if (map.getSource('mapbox-traffic')) map.removeSource('mapbox-traffic');
  }
}