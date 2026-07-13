import { Component, inject, signal, afterNextRender, DestroyRef, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { SimulationService } from '../../shared/services/simulation.service';
import { LocationService } from '../../shared/services/location.service';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule, RouterLink, MatButtonModule, MatIconModule, MatMenuModule,
    MatDividerModule, MatToolbarModule, MatCardModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private locationService = inject(LocationService);
  protected auth = inject(AuthService);
  protected sim = inject(SimulationService);
  protected statusLoaded = signal(false);
  protected showLocationPrompt = signal(false);
  protected locationLoading = signal(false);

  readonly features = signal([
    {
      icon: 'touch_app',
      title: '1. Solicita',
      description: 'Aprieta el botón de emergencia para solicitar una ambulancia inmediatamente.',
    },
    {
      icon: 'assignment',
      title: '2. Asignación',
      description: 'Automáticamente se te asignará la ambulancia más cercana disponible.',
    },
    {
      icon: 'near_me',
      title: '3. Sigue en vivo',
      description: 'Verás en tiempo real por dónde viene la ambulancia y el tiempo estimado de llegada.',
    },
  ]);

  constructor() {
    afterNextRender(() => {
      this.sim.checkStatus();
      this.statusLoaded.set(true);
      const si = setInterval(() => this.sim.checkStatus(), 5000);
      this.destroyRef.onDestroy(() => clearInterval(si));
    });
  }

  private destroyRef = inject(DestroyRef);

  protected pressEmergency() {
    if (!this.sim.status().enabled || this.locationLoading()) return;
    if (this.locationService.hasLocation()) {
      this.router.navigate(['/emergencia']);
      return;
    }
    this.showLocationPrompt.set(true);
  }

  protected allowLocation() {
    this.locationLoading.set(true);
    this.locationService.getCurrentPosition().then((pos) => {
      this.ngZone.run(() => {
        this.showLocationPrompt.set(false);
        this.locationLoading.set(false);
        this.router.navigate(['/emergencia'], {
          state: { lat: pos.lat, lng: pos.lng },
        });
      });
    });
  }

  protected denyLocation() {
    this.showLocationPrompt.set(false);
    this.locationLoading.set(false);
  }
}
