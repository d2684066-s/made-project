import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, RefreshCw, Plus, Bus, AlertTriangle, GraduationCap } from 'lucide-angular';
import { Subscription, interval } from 'rxjs';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';

// Fix for default Leaflet icons
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, LeafletModule, TranslateModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats = signal<any>(null);
  vehicleStatus = signal<any[]>([]);
  loading = signal(true);

  private themeService = inject(ThemeService);
  private translate = inject(TranslateService);

  // Language dropdown state
  languageDropdownOpen = false;
  currentLanguage = 'en';
  

  // Map Layer - Humanitarian OpenStreetMap style
  openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team'
  });

  layers = signal<L.Layer[]>([this.openStreetMapLayer]);

  // Leaflet Map config
  map: L.Map | undefined;
  markers: { [key: string]: L.Marker } = {};

  mapOptions: L.MapOptions = {
  zoom: 15,
  center: L.latLng(21.637265, 85.621219) //Kendhujhar, Odisha locationas defualt
};  //the above lat and long can be changed to any location you want the map to be centered on initially

  private subscription: Subscription | null = null;

  // Custom Icons
  private busIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  private ambulanceIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  constructor(private api: ApiService, private http: HttpClient) {
    // Do not force a language here; AppComponent bootstrapping handles initial language.
    this.currentLanguage = this.translate.currentLang || localStorage.getItem('lang') || 'en';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  get isDarkMode() {
    return this.themeService.isDarkMode();
  }

  switchLanguage(lang: string) {
    // Prefetch the JSON file so TranslatePipe has translations immediately
    this.http.get(`/assets/i18n/${lang}.json`).subscribe({
      next: (translations) => {
        // Merge translations and then activate language
        this.translate.setTranslation(lang, translations as any, true);
        this.translate.use(lang).subscribe({
          next: () => {
            this.currentLanguage = lang;
            localStorage.setItem('lang', lang);
          },
          error: (err) => {
            console.error('translate.use failed for', lang, err);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load translation file for', lang, err);
      }
    });
  }

  ngOnInit() {
    // sync UI language with TranslateService / persisted value
    this.currentLanguage = this.translate.currentLang || localStorage.getItem('lang') || 'en';
    this.translate.onLangChange.subscribe(evt => this.currentLanguage = evt.lang);

    this.fetchData();
    // Poll every 3 seconds to update positions mock
    this.subscription = interval(3000).subscribe(() => {
      this.fetchLiveStatus();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onMapReady(map: L.Map) {
    this.map = map;
    // Invalidate size to ensure map renders correctly if container resized
    setTimeout(() => map.invalidateSize(), 0);
  }

  fetchData() {
    this.loading.set(true);
    this.api.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.fetchLiveStatus();
      },
      error: (err) => console.error(err),
      complete: () => this.loading.set(false)
    });
  }

  fetchLiveStatus() {
    this.api.getTrips({ is_active: true }).subscribe({
      next: (res) => {
        const trips = res.trips || [];
        // Simulate movement for demo
        const movedTrips = trips.map((t: any) => ({
          ...t,
          lat: t.lat + (Math.random() - 0.5) * 0.001,
          lng: t.lng + (Math.random() - 0.5) * 0.001,
          current_speed: Math.max(0, Math.min(80, t.current_speed + (Math.random() - 0.5) * 10))
        }));

        this.vehicleStatus.set(movedTrips);
        this.updateMapMarkers(movedTrips);
      },
      error: (err) => console.error(err)
    });
  }

  updateMapMarkers(trips: any[]) {
    if (!this.map) return;

    // Clear old markers not in current list
    const currentIds = new Set(trips.map(t => t.id));
    Object.keys(this.markers).forEach(id => {
      if (!currentIds.has(id)) {
        this.markers[id].remove();
        delete this.markers[id];
      }
    });

    // Update or add markers
    trips.forEach(trip => {
      if (this.markers[trip.id]) {
        // Smoothly animate to new position (Leaflet doesn't do this natively without plugins, just set new LatLng)
        this.markers[trip.id].setLatLng([trip.lat, trip.lng]);
        this.markers[trip.id].setPopupContent(`
          <b>${trip.vehicle_number}</b><br>
          ${this.translate.instant(trip.vehicle_type.toUpperCase())}<br>
          ${Math.round(trip.current_speed)} km/h
        `);
      } else {
        const icon = trip.vehicle_type === 'ambulance' ? this.ambulanceIcon : this.busIcon;
        const marker = L.marker([trip.lat, trip.lng], { icon })
          .bindPopup(`
            <b>${trip.vehicle_number}</b><br>
            ${this.translate.instant(trip.vehicle_type.toUpperCase())}<br>
            ${Math.round(trip.current_speed)} km/h
          `)
          .addTo(this.map!);
        this.markers[trip.id] = marker;
      }
    });
  }

  getSpeed(trip: any): number {
    return Math.round(trip.current_speed);
  }

  isOverspeed(trip: any): boolean {
    const speed = this.getSpeed(trip);
    return speed > 40 && trip.vehicle_type === 'bus';
  }
}
