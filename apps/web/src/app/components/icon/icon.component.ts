import { Component, input, output, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<i [attr.data-lucide]="name()" class="{{ className() }}"></i>`,
})
export class IconComponent {
  readonly name = input<string>('');
  readonly className = input('w-5 h-5');

  constructor() {
    afterNextRender(() => {
      if ((window as any).lucide) {
        (window as any).lucide.createIcons();
      }
    });
  }
}
