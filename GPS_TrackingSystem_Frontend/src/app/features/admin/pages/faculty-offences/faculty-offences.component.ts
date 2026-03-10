import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Trash2, Plus } from 'lucide-angular';

@Component({
  selector: 'app-faculty-offences',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './faculty-offences.component.html',
  styleUrl: './faculty-offences.component.css'
})
export class FacultyOffencesComponent implements OnInit {
  offences = signal<any[]>([]);
  loading = signal(false);
  selectedOffence = signal<any>(null);
  showForm = signal(false);

  formData = {
    faculty_id: '',
    faculty_name: '',
    violation_type: 'no_helmet',
    severity: 'minor',
    fine_amount: 0,
    description: ''
  };

  constructor(private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.loadOffences();
  }

  loadOffences() {
    this.loading.set(true);
    this.apiService.getFacultyOffences().subscribe({
      next: (data) => {
        this.offences.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading offences', err);
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
    this.formData = {
      faculty_id: '',
      faculty_name: '',
      violation_type: 'no_helmet',
      severity: 'minor',
      fine_amount: 0,
      description: ''
    };
  }

  createOffence() {
    if (!this.formData.faculty_id.trim()) {
      alert('Faculty ID is required');
      return;
    }

    this.loading.set(true);
    this.apiService.createFacultyOffence(this.formData).subscribe({
      next: (response) => {
        this.loadOffences();
        this.closeForm();
        alert('Faculty offence created successfully');
      },
      error: (err) => {
        console.error('Error creating offence', err);
        alert('Error creating offence');
        this.loading.set(false);
      }
    });
  }

  deleteOffence(id: string) {
    if (confirm('Are you sure you want to delete this offence?')) {
      this.apiService.deleteFacultyOffence(id).subscribe({
        next: () => {
          this.loadOffences();
          alert('Offence deleted');
        },
        error: (err) => {
          console.error('Error deleting offence', err);
          alert('Error deleting offence');
        }
      });
    }
  }

  markAsPaid(offence: any) {
    if (confirm('Mark this offence as paid?')) {
      this.apiService.markFacultyOffenceAsPaid(offence.id).subscribe({
        next: () => {
          this.loadOffences();
          alert('Offence marked as paid');
        },
        error: (err) => {
          console.error('Error marking as paid', err);
        }
      });
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'minor':
        return 'text-yellow-600 bg-yellow-50';
      case 'major':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }
}
