import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Trash2, ArrowUp } from 'lucide-angular';

@Component({
    selector: 'app-support-list',
    standalone: true,
    imports: [CommonModule, TranslateModule, LucideAngularModule],
    templateUrl: './support-list.component.html',
    styleUrls: ['./support-list.component.css']
})
export class SupportListComponent implements OnInit {
    issues = signal<any[]>([]);
    loading = signal(false);

    Trash2 = Trash2;
    ArrowUp = ArrowUp;

    constructor(private api: ApiService, private translate: TranslateService) {}

    ngOnInit() {
        this.loadIssues();
    }

    loadIssues() {
        this.loading.set(true);
        this.api.getIssues().subscribe({
            next: (data) => {
                const arr = data.issues || [];
                this.issues.set(Array.isArray(arr) ? arr : []);
            },
            error: (err) => {
                console.error('Failed to load issues', err);
            },
            complete: () => this.loading.set(false)
        });
    }

    push(id: number) {
        this.api.pushIssue(String(id)).subscribe({
            next: () => {
                this.loadIssues();
            },
            error: (err) => console.error('push error', err)
        });
    }

    delete(id: number) {
        if (!confirm(this.translate.instant('CONFIRM_DELETE'))) return;
        this.api.deleteIssue(String(id)).subscribe({
            next: () => {
                this.loadIssues();
            },
            error: (err) => console.error('delete error', err)
        });
    }
}
