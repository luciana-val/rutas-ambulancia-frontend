import { Component, inject, signal, computed, NgZone, viewChild, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { timer, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment } from '../../../environments/environment';
import { SimulationService } from '../../shared/services/simulation.service';
import { LocationService } from '../../shared/services/location.service';
import { MapMarker, AMBULANCE_ICON } from '../../shared/services/map.service';
import { MapView } from '../../shared/components/map-view/map-view';
import { EmergencySearching } from './components/emergency-searching';
import { EmergencyFound } from './components/emergency-found';
import { EmergencyArrival } from './components/emergency-arrival';
import { EmergencyError } from './components/emergency-error';
import { EmergencyFlowContainer } from './components/emergency-flow-container';
import { EmergencyExitDialog } from './components/emergency-exit-dialog';
import { EmergencyThanks } from './components/emergency-thanks';

type FlowState = 'requesting_location' | 'searching' | 'found_confirmation' | 'found' | 'fetching_route' | 'simulating' | 'arrived' | 'no_ambulance' | 'error' | 'thanks';

const SC_LAT = -17.7833;
const SC_LNG = -63.1825;

interface AlertResult {
  alertId: string;
  ambulance: { id: string; plate: string; latitude: number; longitude: number; driverName: string | null } | null;
  hospital: { id: string; name: string; latitude: number; longitude: number };
  message?: string;
}

@Component({
  selector: 'app-emergency-flow',
  imports: [
    EmergencySearching, EmergencyFound, EmergencyArrival, EmergencyError,
    EmergencyFlowContainer, EmergencyExitDialog, EmergencyThanks,
  ],
  templateUrl: './emergency-flow.html',
  styleUrl: './emergency-flow.css',
})
export class EmergencyFlow {
  private router = inject(Router);
  private sim = inject(SimulationService);
  private locationService = inject(LocationService);
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private snackBar = inject(MatSnackBar);
  private mapView = viewChild(MapView);

  protected state = signal<FlowState>('requesting_location');
  protected errorMsg = signal('');
  protected etaSeconds = signal(0);
  protected hospitalName = signal('');
  protected ambulancePlate = signal('');
  protected driverName = signal('');

  protected userPos = signal<{ lat: number; lng: number } | null>(null);
  protected ambPos = signal<{ lat: number; lng: number } | null>(null);
  protected hospitalPos = signal<{ lat: number; lng: number } | null>(null);
  protected routeCoords = signal<[number, number][]>([]);
  protected progress = signal(0);

  protected confirmCountdown = signal(15);
  protected showExitConfirm = signal(false);

  protected readonly timerOffset = computed(() => {
    const circumference = 2 * Math.PI * 26;
    const remaining = this.confirmCountdown() / 15;
    return circumference * (1 - remaining);
  });

  private alertResult: AlertResult | null = null;
  private subs: Subscription[] = [];
  private nearbyNotified = false;
  private confirmSub: Subscription | null = null;

  protected readonly markers = computed<MapMarker[]>(() => {
    const result: MapMarker[] = [];
    const up = this.userPos();
    const ap = this.ambPos();
    const hp = this.hospitalPos();
    const st = this.state();

    if (hp) {
      result.push({
        id: 'hospital',
        lng: hp.lng, lat: hp.lat,
        title: this.hospitalName(),
        subtitle: 'Hospital',
        color: '#1a1a1a',
        text: 'H',
      });
    }
    if (up) {
      result.push({
        id: 'user',
        lng: up.lng, lat: up.lat,
        title: 'Tu ubicación',
        subtitle: st === 'arrived' ? 'Ambulancia llegó' : 'Emergencia',
        color: '#e53935',
        text: '+',
        pulse: true,
      });
    }
    if (ap) {
      result.push({
        id: 'ambulance',
        lng: ap.lng, lat: ap.lat,
        title: this.ambulancePlate() || 'Ambulancia',
        subtitle: this.driverName() ? `Conductor: ${this.driverName()}` : '',
        color: '#1976d2',
        iconSvg: AMBULANCE_ICON,
        pulse: true,
      });
    }
    return result;
  });

  protected onMarkerClick(marker: MapMarker) {
    const mv = this.mapView();
    if (!mv) return;
    const icon = marker.id === 'hospital' ? 'local_hospital' : marker.id === 'ambulance' ? 'directions_car' : 'person_pin';
    const color = marker.color || '#1a1a1a';
    const html = `
      <div style="display:flex;align-items:center;gap:10px;padding:4px 0;">
        <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="font-size:18px;color:white;font-weight:700;">${marker.text || '✓'}</span>
        </div>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a1a1a;">${marker.title}</div>
          ${marker.subtitle ? `<div style="font-size:13px;color:#888;margin-top:2px;">${marker.subtitle}</div>` : ''}
        </div>
      </div>
    `;
    mv.showPopup(marker.lng, marker.lat, html);
  }

  protected readonly etaFormatted = computed(() => {
    const sec = this.etaSeconds();
    if (!sec) return '';
    const simSec = Math.round(sec / 10);
    if (simSec < 60) return `${simSec} seg`;
    const min = Math.floor(simSec / 60);
    const s = simSec % 60;
    return s ? `${min} min ${s} seg` : `${min} minutos`;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.subs.forEach((s) => s.unsubscribe());
      this.confirmSub?.unsubscribe();
    });
    this.state.set('requesting_location');
    const navState = history.state as { lat?: number; lng?: number } | null;
    if (navState?.lat && navState?.lng) {
      this.userPos.set({ lat: navState.lat, lng: navState.lng });
      this.delayedSearch();
    } else {
      this.requestLocation();
    }
  }

  protected async requestLocation() {
    const pos = await this.locationService.getCurrentPosition();
    this.ngZone.run(() => {
      this.userPos.set(pos);
      this.delayedSearch();
    });
  }

  private delayedSearch() {
    this.state.set('searching');
    const delay = 5000 + Math.random() * 10000;
    const sub = timer(delay).subscribe(() => {
      const up = this.userPos();
      if (up) this.searchAmbulance(up.lat, up.lng);
    });
    this.subs.push(sub);
  }

  private searchAmbulance(lat: number, lng: number) {
    this.state.set('searching');
    let errorTimer: Subscription | null = null;

    const attempt = () => {
      const sub = this.sim.createPublicAlert(lat, lng).subscribe({
        next: (res) => {
          errorTimer?.unsubscribe();
          this.alertResult = { alertId: res.alert.id, ambulance: res.ambulance, hospital: res.hospital };
          this.ambulancePlate.set(res.ambulance.plate);
          this.driverName.set(res.ambulance.driverName || '');
          this.hospitalName.set(res.hospital.name);
          this.hospitalPos.set({ lat: res.hospital.latitude, lng: res.hospital.longitude });
          this.ambPos.set({ lat: res.ambulance.latitude, lng: res.ambulance.longitude });
          this.state.set('found_confirmation');
          const foundSub = timer(5000).subscribe(() => {
            this.state.set('found');
            this.fetchRoute();
          });
          this.subs.push(foundSub);
        },
        error: (err) => {
          this.errorMsg.set(err.error?.message || 'Error al buscar ambulancia. Intenta de nuevo.');
          this.state.set('error');
          errorTimer = timer(120000).subscribe(() => {
            this.router.navigate(['/']);
          });
          this.subs.push(errorTimer);
        },
      });
      this.subs.push(sub);
    };

    attempt();
  }

  private async fetchRoute() {
    const ar = this.alertResult;
    if (!ar?.ambulance) return;
    this.state.set('fetching_route');

    try {
      const up = this.userPos();
      if (!up) return;
      const origin = `${ar.ambulance.longitude},${ar.ambulance.latitude}`;
      const dest = `${up.lng},${up.lat}`;

      const departAt = new Date().toISOString().slice(0, 19) + 'Z';
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin};${dest}?geometries=geojson&overview=full&depart_at=${departAt}&access_token=${environment.mapboxToken}`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.routes?.length) {
        this.errorMsg.set('No se pudo calcular la ruta');
        this.state.set('error');
        return;
      }

      const routeData = data.routes[0];
      const coords: [number, number][] = routeData.geometry.coordinates;
      const duration = routeData.duration;
      const distance = routeData.distance;

      this.routeCoords.set(coords);
      this.etaSeconds.set(duration);

      const sub = this.sim.saveRoute(ar.alertId, ar.ambulance.id, coords, duration, distance).subscribe({
        next: () => {
          this.state.set('simulating');
          this.startPolling();
        },
        error: () => {
          this.state.set('simulating');
          this.startPolling();
        },
      });
      this.subs.push(sub);
    } catch {
      this.errorMsg.set('Error al calcular la ruta');
      this.state.set('error');
    }
  }

  private trimRoute(lat: number, lng: number) {
    const coords = this.routeCoords();
    if (coords.length < 2) return;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const dlng = coords[i][0] - lng;
      const dlat = coords[i][1] - lat;
      const d = dlng * dlng + dlat * dlat;
      if (d < minDist) { minDist = d; closest = i; }
    }
    if (closest > 0) this.routeCoords.set(coords.slice(closest));
  }

  private startPolling() {
    const sub = timer(0, 3000).subscribe(() => {
      this.sim.getPositions().subscribe({
        next: (positions) => {
          const ar = this.alertResult;
          if (!ar) return;
          const pos = positions.find((p) => p.alertId === ar.alertId);
          if (pos) {
            this.ambPos.set({ lat: pos.latitude, lng: pos.longitude });
            this.trimRoute(pos.latitude, pos.longitude);
            this.progress.set(Math.round(pos.progress * 100));
            if (pos.progress >= 0.7 && !this.nearbyNotified) {
              this.nearbyNotified = true;
              this.snackBar.open('La ambulancia está cerca', '', { duration: 4000, panelClass: 'snack-nearby', verticalPosition: 'top' });
            }
            if (pos.status === 'at_scene' || pos.status === 'completed' || pos.progress >= 1) {
              this.state.set('arrived');
              this.progress.set(100);
              sub.unsubscribe();
              this.startConfirmTimer();
            }
          }
        },
      });
    });
    this.subs.push(sub);
  }

  protected requestExit() {
    this.showExitConfirm.set(true);
  }

  protected confirmExit() {
    const ar = this.alertResult;
    if (ar) {
      this.sim.cancelAlert(ar.alertId).subscribe();
    }
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    this.confirmSub?.unsubscribe();
    this.confirmSub = null;
    this.router.navigate(['/']);
  }

  protected cancelExit() {
    this.showExitConfirm.set(false);
  }

  protected goHome() {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    this.confirmSub?.unsubscribe();
    this.confirmSub = null;
    this.router.navigate(['/']);
  }

  private startConfirmTimer() {
    this.confirmCountdown.set(15);
    this.confirmSub = timer(0, 1000).subscribe(() => {
      this.confirmCountdown.update((v) => {
        const next = v - 1;
        if (next <= 0) {
          this.confirmSub?.unsubscribe();
          this.confirmArrival();
        }
        return next <= 0 ? 0 : next;
      });
    });
    this.subs.push(this.confirmSub);
  }

  protected confirmArrival() {
    this.confirmSub?.unsubscribe();
    this.state.set('thanks');
  }

  protected retry() {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    this.confirmSub?.unsubscribe();
    this.confirmSub = null;
    this.userPos.set(null);
    this.ambPos.set(null);
    this.hospitalPos.set(null);
    this.routeCoords.set([]);
    this.progress.set(0);
    this.etaSeconds.set(0);
    this.alertResult = null;
    this.nearbyNotified = false;
    this.confirmCountdown.set(15);
    this.requestLocation();
  }
}
