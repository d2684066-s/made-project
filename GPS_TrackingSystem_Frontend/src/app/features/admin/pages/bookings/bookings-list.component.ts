import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Trash2, Eye, Phone, MapPin, PhoneOff } from 'lucide-angular';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './bookings-list.component.html',
  styleUrl: './bookings-list.component.css'
})
export class BookingsListComponent implements OnInit {
  bookings = signal<any[]>([]);
  loading = signal(false);
  selectedBooking = signal<any>(null);
  statusFilter = signal('');
  
  // lucide icons made available to template
  Eye = Eye;
  Trash2 = Trash2;
  Phone = Phone;
  MapPin = MapPin;
  PhoneOff = PhoneOff;

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings() {
    this.loading.set(true);
    const params = this.statusFilter() ? { status: this.statusFilter() } : {};
    
    this.apiService.getBookings(params).subscribe({
      next: (data) => {
        const bookingsArray = data.bookings || data;
        this.bookings.set(Array.isArray(bookingsArray) ? bookingsArray : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading bookings', err);
        this.bookings.set([]);
        this.loading.set(false);
      }
    });
  }

  onFilterChange() {
    this.loadBookings();
  }

  viewDetails(booking: any) {
    this.selectedBooking.set(booking);
  }

  closeDetails() {
    this.selectedBooking.set(null);
  }

  deleteBooking(id: string) {
    if (confirm('Are you sure you want to delete this booking?')) {
      this.loading.set(true);
      // If delete endpoint exists, use it
      this.apiService.deleteBooking(id).subscribe({
        next: () => {
          this.loadBookings();
          alert('Booking deleted');
        },
        error: (err) => {
          console.error('Error deleting booking', err);
          this.loading.set(false);
        }
      });
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPlaceName(place: string): string {
    const places: any = {
      '1': 'Baitarani Hall',
      '2': 'Baladevjew Hall',
      '3': 'Maa Tarini Hall',
      '4': 'Gandhamardan Hall',
      '5': 'Admin Block',
      '6': 'Other'
    };
    return places[place] || place;
  }
}
