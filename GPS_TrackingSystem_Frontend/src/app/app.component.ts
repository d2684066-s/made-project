import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // Instantiate theme service at app root so dark mode is applied from initial load.
  private readonly themeService = inject(ThemeService);

  constructor(private translate: TranslateService) {
    // set default language and restore previously selected language (persisted in localStorage)
    this.translate.setDefaultLang('en');
    const savedLang = localStorage.getItem('lang') || 'en';

    this.translate.use(savedLang).subscribe({
      next: () => {
        // no-op: language initialized
      },
      error: (err) => {
        console.error('Failed to load language', savedLang, err);
        this.translate.use('en').subscribe();
      }
    });

    // Keep a reference to avoid accidental tree-shaking of root effectful service.
    void this.themeService;
  }
} 
