import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private storageKey = 'user_theme_preference';
  private themeSubject = new BehaviorSubject<Theme>(this.getInitialTheme());
  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  private getInitialTheme(): Theme {
    try {
      const htmlTheme = document.documentElement.getAttribute('data-theme');
      if (htmlTheme === 'dark' || htmlTheme === 'light') return htmlTheme;
    } catch {}

    try {
      const stored = localStorage.getItem(this.storageKey) as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}

    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  }

  toggleTheme(): void {
    const next: Theme = this.themeSubject.value === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {}
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme-transition', 'true');
    html.setAttribute('data-theme', theme);
    window.setTimeout(() => html.removeAttribute('data-theme-transition'), 300);
  }
}
