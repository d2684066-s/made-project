import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Eye, Plus } from 'lucide-angular';

@Component({
  selector: 'app-student-offences',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './student-offences.component.html',
  styleUrl: './student-offences.component.css'
})
export class StudentOffencesComponent implements OnInit {
  offences = signal<any[]>([]);
  loading = signal(false);
  showForm = signal(false);
  showAddStudentModal = signal(false);
  showSearchPanel = signal(false);
  showMarkPaidModal = signal(false);
  selectedOffenceForPayment = signal<any | null>(null);
  selectedReceiptFile = signal<File | null>(null);
  isDragOver = signal(false);
  studentSearchRegistration = '';

  studentProfileForm = {
    uuid: '',
    name: '',
    registration_number: '',
    phone_number: ''
  };

  formData = {
    student_id: '',
    student_name: '',
    violation_type: 'no_helmet',
    severity: 'minor',
    fine_amount: 0,
    description: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadOffences();
  }

  loadOffences(params?: any) {
    this.loading.set(true);
    this.apiService.getStudentOffences(params).subscribe({
      next: (data: any) => {
        const offences = Array.isArray(data?.offences)
          ? data.offences
          : (Array.isArray(data) ? data : []);
        this.offences.set(offences);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading offences', err);
        this.loading.set(false);
      }
    });
  }

  toggleSearchPanel() {
    this.showSearchPanel.set(!this.showSearchPanel());
  }

  searchByRegistration() {
    const registration = this.studentSearchRegistration.trim();
    if (!registration) {
      this.loadOffences();
      return;
    }
    this.loadOffences({ student_id: registration });
  }

  resetSearch() {
    this.studentSearchRegistration = '';
    this.loadOffences();
  }

  openAddStudentModal() {
    this.resetStudentProfileForm();
    this.showAddStudentModal.set(true);
  }

  closeAddStudentModal() {
    this.showAddStudentModal.set(false);
  }

  resetStudentProfileForm() {
    this.studentProfileForm = {
      uuid: '',
      name: '',
      registration_number: '',
      phone_number: ''
    };
  }

  addStudentProfile() {
    const payload = {
      uuid: this.studentProfileForm.uuid.trim(),
      name: this.studentProfileForm.name.trim(),
      registration_number: this.studentProfileForm.registration_number.trim(),
      phone_number: this.studentProfileForm.phone_number.trim(),
    };

    if (!payload.uuid || !payload.name || !payload.registration_number) {
      alert('UUID, Name, and Registration Number are required.');
      return;
    }

    this.loading.set(true);
    this.apiService.addStudentProfile(payload).subscribe({
      next: (res: any) => {
        alert(res?.message || 'Student added successfully.');
        this.resetStudentProfileForm();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error adding student', err);
        const detail = err?.error?.detail || 'Failed to add student.';
        alert(detail);
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
      student_id: '',
      student_name: '',
      violation_type: 'no_helmet',
      severity: 'minor',
      fine_amount: 0,
      description: ''
    };
  }

  createOffence() {
    if (!this.formData.student_id.trim()) {
      alert('Student ID is required');
      return;
    }

    this.loading.set(true);
    this.apiService.createStudentOffence(this.formData).subscribe({
      next: (response) => {
        this.loadOffences();
        this.closeForm();
        alert('Student offence created successfully');
      },
      error: (err) => {
        console.error('Error creating offence', err);
        alert('Error creating offence');
        this.loading.set(false);
      }
    });
  }

  openMarkPaidModal(offence: any) {
    this.selectedOffenceForPayment.set(offence);
    this.selectedReceiptFile.set(null);
    this.showMarkPaidModal.set(true);
  }

  closeMarkPaidModal() {
    this.showMarkPaidModal.set(false);
    this.selectedOffenceForPayment.set(null);
    this.selectedReceiptFile.set(null);
    this.isDragOver.set(false);
  }

  onReceiptChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.setReceiptFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0] || null;
    this.setReceiptFile(file);
  }

  setReceiptFile(file: File | null) {
    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
    if (!isPdf) {
      alert('Only PDF files are allowed.');
      return;
    }

    this.selectedReceiptFile.set(file);
  }

  confirmMarkPaid() {
    const offence = this.selectedOffenceForPayment();
    const receiptFile = this.selectedReceiptFile();

    if (!offence || !offence.id) {
      alert('No offence selected.');
      return;
    }
    if (!receiptFile) {
      alert('Please upload a PDF receipt before marking paid.');
      return;
    }

    this.loading.set(true);
    this.apiService.markStudentOffenceAsPaid(offence.id, receiptFile).subscribe({
      next: () => {
        this.closeMarkPaidModal();
        this.loadOffences();
        alert('Offence marked as paid successfully.');
      },
      error: (err) => {
        console.error('Error marking as paid', err);
        alert('Failed to mark offence as paid.');
        this.loading.set(false);
      }
    });
  }

  viewReceipt(offence: any) {
    const receiptUrl = offence?.receipt_pdf_url;
    if (!receiptUrl) {
      alert('No receipt available for this offence.');
      return;
    }
    window.open(receiptUrl, '_blank', 'noopener');
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
