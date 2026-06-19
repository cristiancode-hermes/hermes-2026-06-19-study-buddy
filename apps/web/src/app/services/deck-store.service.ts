import { inject, Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { Deck } from '../models/interfaces';

@Injectable()
export class DeckStoreService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly decks = signal<Deck[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isEmpty = computed(() => this.decks().length === 0);

  readonly stats = computed(() => {
    const d = this.decks();
    const totalDecks = d.length;
    const totalCards = d.reduce((sum, deck) => sum + deck.cardCount, 0);
    const dueToday = d.reduce((sum, deck) => sum + deck.dueCount, 0);
    return { totalDecks, totalCards, dueToday };
  });

  loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    return firstValueFrom(this.api.get<Deck[]>('/decks'))
      .then((decks) => {
        this.decks.set(decks);
        this.loading.set(false);
      })
      .catch((err) => {
        this.loading.set(false);
        const msg = err.error?.message || err.message || 'Failed to load decks';
        this.error.set(msg);
      });
  }

  create(name: string, description?: string): Promise<Deck> {
    return firstValueFrom(this.api.post<Deck>('/decks', { name, description }))
      .then((deck) => {
        this.decks.update((decks) => [...decks, deck]);
        this.toast.show('Deck created successfully!', 'success');
        return deck;
      })
      .catch((err) => {
        const msg = err.error?.message || err.message || 'Failed to create deck';
        this.toast.show(msg, 'error');
        throw err;
      });
  }

  update(id: number, data: Partial<Deck>): Promise<Deck> {
    return firstValueFrom(this.api.put<Deck>(`/decks/${id}`, data))
      .then((updated) => {
        this.decks.update((decks) => decks.map((d) => (d.id === id ? updated : d)));
        this.toast.show('Deck updated!', 'success');
        return updated;
      })
      .catch((err) => {
        const msg = err.error?.message || err.message || 'Failed to update deck';
        this.toast.show(msg, 'error');
        throw err;
      });
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.api.delete<void>(`/decks/${id}`))
      .then(() => {
        this.decks.update((decks) => decks.filter((d) => d.id !== id));
        this.toast.show('Deck deleted.', 'info');
      })
      .catch((err) => {
        const msg = err.error?.message || err.message || 'Failed to delete deck';
        this.toast.show(msg, 'error');
        throw err;
      });
  }
}
