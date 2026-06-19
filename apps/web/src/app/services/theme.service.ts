import { Injectable, signal, effect } from '@angular/core';

@Injectable()
export class ThemeService {
  readonly isDark = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      localStorage.setItem('study-buddy-theme', dark ? 'dark' : 'light');
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  private getInitialTheme(): boolean {
    const stored = localStorage.getItem('study-buddy-theme');
    if (stored !== null) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }
}
