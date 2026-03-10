import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  constructor(private translate: TranslateService, private http: HttpClient) {
    // set default language and restore previously selected language (persisted in localStorage)
    this.translate.setDefaultLang('en');
    const savedLang = localStorage.getItem('lang') || 'en';

    // pre-load translation file (ensures translate pipe has data immediately)
    this.http.get(`/assets/i18n/${savedLang}.json`).subscribe({
      next: (translations) => {
        this.translate.setTranslation(savedLang, translations as any, true);
        this.translate.use(savedLang).subscribe({ next: () => console.log(`Translations loaded for ${savedLang}`) });
      },
      error: (err) => {
        console.error('Failed to fetch translation file for', savedLang, err);
        // fall back to English
        if (savedLang !== 'en') {
          this.http.get('/assets/i18n/en.json').subscribe({
            next: (t) => { this.translate.setTranslation('en', t as any, true); this.translate.use('en').subscribe(); },
            error: () => this.translate.use('en').subscribe()
          });
        }
      }
    });

    // debug hook — updates when language changes at runtime
    this.translate.onLangChange.subscribe(evt => console.log('onLangChange ->', evt.lang));
  }
} 
