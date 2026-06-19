import { Injectable, signal } from '@angular/core';
import { Toast } from '../models/interfaces';

@Injectable()
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, type: Toast['type'] = 'info'): void {
    const id = this.nextId++;
    this.toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 3000);
  }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
