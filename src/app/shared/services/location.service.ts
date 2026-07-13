import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private cachedPos: { lat: number; lng: number } | null = null;
  private attempted = false;

  hasLocation() {
    return this.cachedPos !== null;
  }

  hasAttempted() {
    return this.attempted;
  }

  getCachedPosition() {
    return this.cachedPos;
  }

  async getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    this.attempted = true;
    if (this.cachedPos) return this.cachedPos;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 0,
        });
      });
      this.cachedPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      return this.cachedPos;
    } catch {
      return this.getIpLocation();
    }
  }

  private async getIpLocation(): Promise<{ lat: number; lng: number }> {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.latitude && data.longitude) {
        this.cachedPos = { lat: data.latitude, lng: data.longitude };
        return this.cachedPos;
      }
    } catch {
      // ipapi.co fallback
    }
    try {
      const res = await fetch('https://ip-api.com/json/');
      const data = await res.json();
      if (data.lat && data.lon) {
        this.cachedPos = { lat: data.lat, lng: data.lon };
        return this.cachedPos;
      }
    } catch {
      // ip-api.com fallback
    }
    return { lat: -17.7833, lng: -63.1825 };
  }
}
