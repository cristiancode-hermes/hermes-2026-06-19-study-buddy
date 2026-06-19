import { inject, Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { StudyCard, SessionStats } from '../models/interfaces';

@Injectable()
export class StudyService {
  private readonly api = inject(ApiService);

  readonly dueCards = signal<StudyCard[]>([]);
  readonly currentIndex = signal(0);
  readonly isFlipped = signal(false);
  readonly sessionComplete = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly sessionStats = signal<SessionStats>({ viewed: 0, correct: 0 });

  readonly currentCard = computed(() => {
    const cards = this.dueCards();
    const idx = this.currentIndex();
    return idx < cards.length ? cards[idx] : null;
  });

  readonly progress = computed(() => {
    const total = this.dueCards().length;
    const current = this.currentIndex() + 1;
    return { current, total };
  });

  loadDueCards(deckId: number): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    this.isFlipped.set(false);
    this.sessionComplete.set(false);
    this.currentIndex.set(0);
    this.sessionStats.set({ viewed: 0, correct: 0 });

    return firstValueFrom(this.api.get<StudyCard[]>(`/decks/${deckId}/due`))
      .then((cards) => {
        this.dueCards.set(cards);
        this.isLoading.set(false);
      })
      .catch((err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.message || 'Failed to load due cards';
        this.error.set(msg);
      });
  }

  flipCard(): void {
    this.isFlipped.update((v) => !v);
  }

  submitRating(cardId: number, quality: number): Promise<void> {
    this.isFlipped.set(false);
    return firstValueFrom(
      this.api.post<StudyCard>(`/cards/${cardId}/review`, { quality }),
    )
      .then(() => {
        this.sessionStats.update((s) => ({
          viewed: s.viewed + 1,
          correct: quality >= 3 ? s.correct + 1 : s.correct,
        }));
      })
      .catch(() => {
        // Continue anyway, just track locally
        this.sessionStats.update((s) => ({
          viewed: s.viewed + 1,
          correct: quality >= 3 ? s.correct + 1 : s.correct,
        }));
      });
  }

  nextCard(): void {
    const nextIdx = this.currentIndex() + 1;
    if (nextIdx >= this.dueCards().length) {
      this.sessionComplete.set(true);
    } else {
      this.currentIndex.set(nextIdx);
    }
  }
}
