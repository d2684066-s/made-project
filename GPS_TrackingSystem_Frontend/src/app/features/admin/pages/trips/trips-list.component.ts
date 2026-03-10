import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Trash2, Eye, MapPin, Clock, User, Truck } from 'lucide-angular';

@Component({
  selector: 'app-trips-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './trips-list.component.html',
  styleUrl: './trips-list.component.css'
})
export class TripsListComponent implements OnInit {
  trips = signal<any[]>([]);
  loading = signal(false);
  selectedTrip = signal<any>(null);
  vehicleTypeFilter = signal('');
  activeFilter = signal(true);
  
  // lucide icons available to template
  Trash2 = Trash2;
  Eye = Eye;
  MapPin = MapPin;
  Clock = Clock;
  User = User;
  Truck = Truck;

  vehicleTypeOptions = [
    { value: '', label: 'All Vehicles' },
    { value: 'bus', label: 'Bus' },
    { value: 'ambulance', label: 'Ambulance' }
  ];

  constructor(private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.loading.set(true);
    const params: any = {};
    
    if (this.vehicleTypeFilter()) {
      params.vehicle_type = this.vehicleTypeFilter();
    }
    params.is_active = this.activeFilter();
    
    this.apiService.getTrips(params).subscribe({
      next: (data) => {
        const tripsArray = data.trips || data;
        this.trips.set(Array.isArray(tripsArray) ? tripsArray : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading trips', err);
        this.trips.set([]);
        this.loading.set(false);
      }
    });
  }

  onFilterChange() {
    this.loadTrips();
  }

  toggleActiveFilter(value: boolean) {
    this.activeFilter.set(value);
    this.loadTrips();
  }

  viewDetails(trip: any) {
    this.selectedTrip.set(trip);
  }

  closeDetails() {
    this.selectedTrip.set(null);
  }

  deleteTrip(id: string) {
    if (confirm('Are you sure you want to delete this trip?')) {
      this.loading.set(true);
      // If delete endpoint exists, use it
      this.apiService.deleteTrip(id).subscribe({
        next: () => {
          this.loadTrips();
          alert('Trip deleted');
        },
        error: (err) => {
          console.error('Error deleting trip', err);
          this.loading.set(false);
        }
      });
    }
  }

  getStatusBadge(trip: any): string {
    if (trip.is_active) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  getStatusText(trip: any): string {
    return trip.is_active ? 'ACTIVE' : 'COMPLETED';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  }

  calculateDuration(startTime: string, endTime: string | null): string {
    if (!startTime) return '-';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  }
}
