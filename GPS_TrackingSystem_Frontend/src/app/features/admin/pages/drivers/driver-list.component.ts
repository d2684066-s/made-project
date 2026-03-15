import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Trash2, Search } from 'lucide-angular';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './driver-list.component.html',
  styleUrl: './driver-list.component.css'
})
export class DriverListComponent implements OnInit {
  drivers = signal<any[]>([]);
  loading = signal(false);
  searchTerm = signal('');

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadDrivers();
  }

  loadDrivers() {
    this.loading.set(true);
    this.api.getDrivers({ search: this.searchTerm() }).subscribe({
      next: (data: any) => {
        this.drivers.set(data.drivers || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('failed loading drivers', err);
        this.loading.set(false);
      }
    });
  }

  search() {
    this.loadDrivers();
  }

  deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.api.deleteUser(id).subscribe({
      next: () => {
        alert('User deleted');
        this.loadDrivers();
      },
      error: (err) => {
        console.error('delete error', err);
        alert('Delete failed');
      }
    });
  }
}
