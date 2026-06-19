import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      [class]="{
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300': variant() === 'easy',
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300': variant() === 'medium',
        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300': variant() === 'hard',
        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300': variant() === 'ai',
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300': variant() === 'default',
      }"
    >
      {{ text() }}
    </span>
  `,
})
export class BadgeComponent {
  readonly variant = input<'easy' | 'medium' | 'hard' | 'ai' | 'default'>('default');
  readonly text = input('');
}
