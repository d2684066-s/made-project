import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Wifi, Trash2, Plus } from 'lucide-angular';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-esp32-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './esp32-devices.component.html',
  styleUrl: './esp32-devices.component.css'
})
export class ESP32DevicesComponent implements OnInit {
  devices = signal<any[]>([]);
  loading = signal(false);
  formData = { device_id: '', device_name: '', description: '' };
  showForm = signal(false);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.loading.set(true);
    this.apiService.getESP32Devices().subscribe({
      next: (data) => {
        this.devices.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading ESP32 devices', err);
        this.loading.set(false);
      }
    });
  }

  openForm() {
    this.showForm.set(true);
    this.resetForm();
  }

  closeForm() {
    this.showForm.set(false);
    this.resetForm();
  }

  resetForm() {
    this.formData = { device_id: '', device_name: '', description: '' };
  }

  addDevice() {
    if (!this.formData.device_id.trim() || !this.formData.device_name.trim()) {
      alert('ID and name required');
      return;
    }
    this.loading.set(true);
    this.apiService.addESP32Device(this.formData).subscribe({
      next: () => {
        this.loadDevices();
        this.closeForm();
      },
      error: (err) => {
        console.error('Failed to add device', err);
        this.loading.set(false);
      }
    });
  }

  deleteDevice(id: string) {
    if (confirm('Delete device?')) {
      this.apiService.deleteESP32Device(id).subscribe({
        next: () => this.loadDevices(),
        error: (err) => console.error('delete error', err)
      });
    }
  }
}
