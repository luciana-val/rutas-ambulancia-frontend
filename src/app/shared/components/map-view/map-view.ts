import { Component, ElementRef, viewChild, afterNextRender, input, output, effect, OnDestroy, NgZone } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { MapService, MapMarker } from '../../services/map.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-map-view',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div #mapContainer class="map-container"></div>
    @if (showControls()) {
      <button class="traffic-btn" mat-mini-fab (click)="toggleTraffic()" [class.active]="trafficVisible" matTooltip="Capa de tráfico">
        <mat-icon>traffic</mat-icon>
      </button>
    }
  `,
  styles: [`
    .map-container { width: 100%; height: 100%; }
    .traffic-btn {
      position: absolute !important;
      bottom: 24px; right: 24px;
      z-index: 10;
      background: white !important;
      color: #1a1a1a !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
    }
    .traffic-btn.active {
      background: #1a1a1a !important;
      color: white !important;
    }
  `],
  host: { style: 'display: block; position: relative; width: 100%; height: 100%;' },
})
export class MapView implements OnDestroy {
  readonly mapContainer = viewChild.required<ElementRef<HTMLElement>>('mapContainer');

  readonly markers = input<MapMarker[]>([]);
  readonly route = input<[number, number][]>([]);
  readonly routeColor = input<string>('#1976d2');
  readonly center = input<[number, number]>([-63.1825, -17.7833]);
  readonly zoom = input<number>(6);
  readonly showControls = input<boolean>(true);
  readonly showTraffic = input<boolean>(false);
  readonly interactive = input<boolean>(true);

  readonly markerClick = output<MapMarker>();
  readonly mapClick = output<{ lng: number; lat: number }>();
  readonly contextMenuClick = output<{ lng: number; lat: number }>();
  readonly mapReady = output<void>();

  trafficVisible = false;
  private map: mapboxgl.Map | null = null;
  private mapId: string;
  private markerObjs: mapboxgl.Marker[] = [];
  private popup: mapboxgl.Popup | null = null;
  private initialized = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private mapService: MapService, private ngZone: NgZone) {
    this.mapId = 'map-' + Math.random().toString(36).slice(2, 9);

    afterNextRender(() => {
      this.initMap();
    });

    effect(() => {
      const m = this.markers();
      if (this.initialized) {
        this.syncMarkers(m);
      }
    });

    effect(() => {
      const r = this.route();
      if (this.initialized && this.map) {
        this.syncRoute(r);
      }
    });

    effect(() => {
      const c = this.center();
      if (this.initialized && this.map) {
        this.map.setCenter(c);
      }
    });

    effect(() => {
      const show = this.showTraffic();
      if (!this.initialized || !this.map) return;

      if (show) {
        this.mapService.addTrafficLayer(this.map);
        this.trafficVisible = true;
      } else {
        this.mapService.removeTrafficLayer(this.map);
        this.trafficVisible = false;
      }
    });
  }

  private initMap() {
    const el = this.mapContainer().nativeElement;
    this.map = this.mapService.initMap(this.mapId, el, this.center(), this.zoom());

    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.resize();
      }
    });
    this.resizeObserver.observe(el);

    this.map.on('style.load', () => {
      if (this.showTraffic() && this.map) {
        this.mapService.addTrafficLayer(this.map);
        this.trafficVisible = true;
      }
    });

    this.map.once('load', () => {
      this.initialized = true;
      const m = this.markers();
      if (m.length) {
        this.syncMarkers(m);
      }
      const r = this.route();
      if (r && r.length) {
        this.syncRoute(r);
      }
      this.mapReady.emit();
    });

    if (this.interactive()) {
      this.map.on('click', (e) => {
        this.ngZone.run(() => {
          this.mapClick.emit({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        });
      });

      this.map.on('contextmenu', (e) => {
        e.originalEvent.preventDefault();
        this.ngZone.run(() => {
          this.contextMenuClick.emit({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        });
      });
    }
  }

  private syncMarkers(markers: MapMarker[]) {
    this.clearMarkers();
    markers.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      const isPulse = m.pulse;
      const size = isPulse ? 48 : 36;
      const fontSize = isPulse ? (m.iconSvg ? '' : '20px') : (m.iconSvg ? '' : '14px');
      const borderWidth = isPulse ? 3 : 3;
      const iconSize = isPulse ? '28' : '20';
      const inner = document.createElement('div');
      inner.style.cssText = `
        width: ${size}px; height: ${size}px;
        background: ${m.color || '#1a1a1a'};
        border-radius: 50%;
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 12px rgba(0,0,0,0.35);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      `;
      if (m.iconSvg) {
        const sized = m.iconSvg.replace('width="20"', `width="${iconSize}"`).replace('height="20"', `height="${iconSize}"`);
        inner.innerHTML = sized;
      } else {
        inner.textContent = m.text || 'H';
        inner.style.fontSize = fontSize;
        inner.style.color = 'white';
        inner.style.fontWeight = '700';
      }
      if (isPulse) {
        inner.animate([
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.15)', opacity: 0.85 },
          { transform: 'scale(1)', opacity: 1 },
        ], { duration: 1500, iterations: Infinity, easing: 'ease-in-out' });
      }
      inner.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.3)'; });
      inner.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)'; });
      el.appendChild(inner);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.ngZone.run(() => this.markerClick.emit(m));
      });
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .addTo(this.map!);
      this.markerObjs.push(marker);
    });
  }

  showPopup(lng: number, lat: number, html: string) {
    this.removePopup();
    this.popup = new mapboxgl.Popup({ offset: 25, closeButton: true, maxWidth: '300px' })
      .setLngLat([lng, lat])
      .setHTML(html)
      .addTo(this.map!);
  }

  removePopup() {
    this.popup?.remove();
    this.popup = null;
  }

  flyTo(lng: number, lat: number, zoom: number = 14) {
    this.map?.flyTo({ center: [lng, lat], zoom, duration: 1000 });
  }

  private clearMarkers() {
    this.markerObjs.forEach((m) => m.remove());
    this.markerObjs = [];
  }

  private syncRoute(coords: [number, number][]) {
    if (!this.map) return;
    const srcId = 'route-source';
    const layerId = 'route-layer';

    if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
    if (this.map.getSource(srcId)) this.map.removeSource(srcId);

    if (!coords.length) return;

    this.map.addSource(srcId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
    });
    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: srcId,
      paint: {
        'line-color': this.routeColor(),
        'line-width': 4,
        'line-opacity': 0.8,
      },
    });
  }

  toggleTraffic() {
    if (!this.map) return;
    if (this.trafficVisible) {
      this.mapService.removeTrafficLayer(this.map);
      this.trafficVisible = false;
    } else {
      this.mapService.addTrafficLayer(this.map);
      this.trafficVisible = true;
    }
  }

  ngOnDestroy() {
    this.clearMarkers();
    this.popup?.remove();
    this.resizeObserver?.disconnect();
    this.mapService.destroyMap(this.mapId);
  }
}
