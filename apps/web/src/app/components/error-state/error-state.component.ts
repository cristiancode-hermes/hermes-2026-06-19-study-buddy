import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h3>
      @if (message()) {
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">{{ message() }}</p>
      }
      @if (retryLabel()) {
        <button
          (click)="retry.emit()"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {{ retryLabel() }}
        </button>
      }
    </div>
  `,
})
export class ErrorStateComponent {
  readonly message = input('');
  readonly retryLabel = input('');
  readonly retry = output<void>();
}
