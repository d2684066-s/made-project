import { Injectable, signal, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDarkMode = signal<boolean>(true);

    constructor() {
        // Load from local storage or default to dark
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            this.isDarkMode.set(storedTheme === 'dark');
        }

        // Effect to update body class and local storage
        effect(() => {
            if (this.isDarkMode()) {
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    toggleTheme() {
        this.isDarkMode.update(current => !current);
    }
}
