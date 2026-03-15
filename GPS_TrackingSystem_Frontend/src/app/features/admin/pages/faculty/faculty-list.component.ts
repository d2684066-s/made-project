import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Trash2, Search } from 'lucide-angular';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-faculty-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './faculty-list.component.html',
  styleUrl: './faculty-list.component.css'
})
export class FacultyListComponent implements OnInit {
  faculty = signal<any[]>([]);
  loading = signal(false);
  searchTerm = signal('');

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadFaculty();
  }

  loadFaculty() {
    this.loading.set(true);
    this.api.getFaculty({ search: this.searchTerm() }).subscribe({
      next: (data: any) => {
        this.faculty.set(data.faculty || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('failed loading faculty', err);
        this.loading.set(false);
      }
    });
  }

  search() {
    this.loadFaculty();
  }

  deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.api.deleteFaculty(id).subscribe({
      next: () => {
        alert('User deleted');
        this.loadFaculty();
      },
      error: (err) => {
        console.error('delete error', err);
        alert('Delete failed');
      }
    });
  }
}