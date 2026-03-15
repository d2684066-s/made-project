import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, signal, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, RefreshCw, Plus, Bus, AlertTriangle, GraduationCap } from 'lucide-angular';
import { Subscription, interval } from 'rxjs';
import maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, TranslateModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  stats = signal<any>(null);
  vehicleStatus = signal<any[]>([]);
  loading = signal(true);

  private translate = inject(TranslateService);
  private ngZone = inject(NgZone);

  // Language dropdown state
  languageDropdownOpen = false;
  currentLanguage = 'en';

  // MapLibre map instance
  map: maplibregl.Map | undefined;
  markers: { [key: string]: maplibregl.Marker } = {};
  private mapLoaded = false;

  private subscription: Subscription | null = null;

  constructor(private api: ApiService) {
    this.currentLanguage = this.translate.currentLang || localStorage.getItem('lang') || 'en';
  }

  switchLanguage(lang: string) {
    this.translate.use(lang).subscribe({
      next: () => {
        this.currentLanguage = lang;
        localStorage.setItem('lang', lang);
      },
      error: (err) => {
        console.error('translate.use failed for', lang, err);
      }
    });
  }

  ngOnInit() {
    this.currentLanguage = this.translate.currentLang || localStorage.getItem('lang') || 'en';
    this.translate.onLangChange.subscribe(evt => this.currentLanguage = evt.lang);

    this.fetchData();
    this.subscription = interval(3000).subscribe(() => {
      this.fetchLiveStatus();
    });
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        // Using Google Hybrid (Satellite + Labels) — Best for shops, roads, and POIs
        style: {
          version: 8,
          sources: {
            'google-satellite': {
              type: 'raster',
              tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
              tileSize: 256,
              attribution: '© Google'
            },
            'google-labels': {
              type: 'raster',
              tiles: ['https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}'],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'google-satellite-layer',
              type: 'raster',
              source: 'google-satellite',
              minzoom: 0,
              maxzoom: 22
            },
            {
              id: 'google-labels-layer',
              type: 'raster',
              source: 'google-labels',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: [85.621219, 21.637265],
        zoom: 16,
        pitch: 60,
        bearing: -10
      });

      // Add zoom + compass controls
      this.map.addControl(new maplibregl.NavigationControl());

      this.map.on('load', () => {
        this.mapLoaded = true;
        // Render any vehicle data that arrived before map finished loading
        this.ngZone.run(() => {
          const trips = this.vehicleStatus();
          if (trips.length > 0) this.updateMapMarkers(trips);
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.map) {
      this.map.remove();
    }
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
      next: (res: any) => {
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
      error: (err: any) => console.error(err)
    });
  }

  updateMapMarkers(trips: any[]) {
    if (!this.map || !this.mapLoaded) return;

    // Remove markers no longer in the active list
    const currentIds = new Set(trips.map(t => String(t.id)));
    Object.keys(this.markers).forEach(id => {
      if (!currentIds.has(id)) {
        this.markers[id].remove();
        delete this.markers[id];
      }
    });

    // Update or create markers
    trips.forEach(trip => {
      const lngLat: [number, number] = [trip.lng, trip.lat];
      const color = trip.vehicle_type === 'ambulance' ? '#ef4444' : '#3b82f6';
      const popupHtml = `
        <b>${trip.vehicle_number}</b><br>
        ${this.translate.instant(trip.vehicle_type.toUpperCase())}<br>
        ${Math.round(trip.current_speed)} km/h
      `;

      const id = String(trip.id);
      if (this.markers[id]) {
        this.markers[id].setLngLat(lngLat);
        this.markers[id].getPopup()?.setHTML(popupHtml);
      } else {
        // Custom pulsing dot element
        const el = document.createElement('div');
        el.style.cssText = [
          `background-color:${color}`,
          'width:16px',
          'height:16px',
          'border-radius:50%',
          'border:3px solid white',
          'box-shadow:0 2px 8px rgba(0,0,0,0.5)',
          'cursor:pointer'
        ].join(';');

        const popup = new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(lngLat)
          .setPopup(popup)
          .addTo(this.map!);
        this.markers[id] = marker;
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
