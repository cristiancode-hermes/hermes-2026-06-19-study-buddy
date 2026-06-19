import { Component, input, output, inject, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/dashboard" class="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M22 10v6M2 10l10-5 10 5-10 5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            Study Buddy
          </a>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-6">
            <a routerLink="/dashboard" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Dashboard</a>
            <a routerLink="/ai-generate" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">AI Generate</a>
            <a routerLink="/settings" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Settings</a>
          </nav>

          <!-- Right side -->
          <div class="flex items-center gap-4">
            <!-- Search -->
            <div class="relative hidden sm:block">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="text"
                placeholder="Search decks..."
                [value]="searchQuery()"
                (input)="onSearch($event)"
                class="w-48 lg:w-64 pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <!-- Theme toggle -->
            <button
              (click)="themeService.toggle()"
              class="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (themeService.isDark()) {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  readonly searchChange = output<string>();
  readonly searchQuery = input('');

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }
}
