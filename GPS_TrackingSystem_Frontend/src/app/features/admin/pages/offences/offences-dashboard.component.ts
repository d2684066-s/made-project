import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, GraduationCap, UserCog } from 'lucide-angular';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-offences-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, LucideAngularModule],
  templateUrl: './offences-dashboard.component.html',
  styleUrl: './offences-dashboard.component.css'
})
export class OffencesDashboardComponent implements OnInit {
  studentCount = signal<number>(0);
  facultyCount = signal<number>(0);
  loading = signal(false);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadCounts();
  }

  loadCounts() {
    this.loading.set(true);
    this.api.getStudentOffences().subscribe({
      next: (data: any) => {
        this.studentCount.set(Array.isArray(data) ? data.length : 0);
        this.loading.set(false);
      },
      error: () => {
        this.studentCount.set(0);
        this.loading.set(false);
      }
    });
    this.api.getFacultyOffences().subscribe({
      next: (data: any) => {
        this.facultyCount.set(Array.isArray(data) ? data.length : 0);
      },
      error: () => {
        this.facultyCount.set(0);
      }
    });
  }
}
