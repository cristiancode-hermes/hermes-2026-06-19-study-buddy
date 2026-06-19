import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          (click)="close.emit()"
        ></div>
        <!-- Modal -->
        <div
          class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full transition-all"
          [class]="{
            'max-w-sm': size() === 'sm',
            'max-w-md': size() === 'md',
            'max-w-lg': size() === 'lg',
          }"
        >
          @if (title()) {
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title() }}</h3>
              <button
                (click)="close.emit()"
                class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          }
          <div class="px-6 py-4">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly close = output<void>();
}
