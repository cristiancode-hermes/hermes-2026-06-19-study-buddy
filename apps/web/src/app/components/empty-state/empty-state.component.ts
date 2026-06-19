import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      @if (icon()) {
        <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span class="text-3xl">{{ icon() }}</span>
        </div>
      }
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{{ title() }}</h3>
      @if (description()) {
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button
          (click)="action.emit()"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('');
  readonly title = input('');
  readonly description = input('');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
