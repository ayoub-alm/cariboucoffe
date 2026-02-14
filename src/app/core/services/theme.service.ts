import { Injectable, signal, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'app-theme';

    // Signal for reactive theme state
    isDarkMode = signal<boolean>(this.getInitialTheme());

    constructor() {
        // Apply theme on initialization
        this.applyTheme(this.isDarkMode());

        // Watch for theme changes and persist
        effect(() => {
            const darkMode = this.isDarkMode();
            this.applyTheme(darkMode);
            localStorage.setItem(this.THEME_KEY, darkMode ? 'dark' : 'light');
        });

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem(this.THEME_KEY)) {
                    this.isDarkMode.set(e.matches);
                }
            });
        }
    }

    private getInitialTheme(): boolean {
        // Check localStorage first
        const savedTheme = localStorage.getItem(this.THEME_KEY);
        if (savedTheme) {
            return savedTheme === 'dark';
        }

        // Fall back to system preference
        if (window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        return false;
    }

    private applyTheme(isDark: boolean): void {
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    toggleTheme(): void {
        this.isDarkMode.update(current => !current);
    }

    setTheme(isDark: boolean): void {
        this.isDarkMode.set(isDark);
    }
}
