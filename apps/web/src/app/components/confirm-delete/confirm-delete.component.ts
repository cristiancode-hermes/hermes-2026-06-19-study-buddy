import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="cancelled.emit()"></div>
      <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div class="flex flex-col items-center text-center">
          <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{{ title() }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">{{ message() }}</p>
          @if (itemName()) {
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">"{{ itemName() }}"</p>
          }
          <div class="flex gap-3 w-full">
            <button
              (click)="cancelled.emit()"
              class="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmed.emit()"
              class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDeleteComponent {
  readonly title = input('Delete item');
  readonly message = input('Are you sure you want to delete this? This action cannot be undone.');
  readonly itemName = input('');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
