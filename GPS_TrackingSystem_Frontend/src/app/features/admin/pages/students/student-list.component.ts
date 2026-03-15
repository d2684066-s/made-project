import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Trash2, Search } from 'lucide-angular';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.css'
})
export class StudentListComponent implements OnInit {
  students = signal<any[]>([]);
  loading = signal(false);
  searchTerm = signal('');

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.loading.set(true);
    this.api.getStudents({ search: this.searchTerm() }).subscribe({
      next: (data: any) => {
        this.students.set(data.students || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('failed loading students', err);
        this.loading.set(false);
      }
    });
  }

  search() {
    this.loadStudents();
  }

  deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.api.deleteUser(id).subscribe({
      next: () => {
        alert('User deleted');
        this.loadStudents();
      },
      error: (err) => {
        console.error('delete error', err);
        alert('Delete failed');
      }
    });
  }
}
