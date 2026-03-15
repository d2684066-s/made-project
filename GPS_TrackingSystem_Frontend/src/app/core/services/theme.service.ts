import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDarkMode = signal<boolean>(true);

    private applyThemeClass(isDark: boolean) {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
    }

    constructor() {
        // Light theme is disabled. Force dark mode globally.
        this.isDarkMode.set(true);
        this.applyThemeClass(true);
        localStorage.setItem('theme', 'dark');
    }

    toggleTheme() {
        // Keep dark mode locked.
        this.isDarkMode.set(true);
        this.applyThemeClass(true);
        localStorage.setItem('theme', 'dark');
    }
}
