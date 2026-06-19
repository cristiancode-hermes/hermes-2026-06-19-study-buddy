import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { DeckStoreService } from '../../services/deck-store.service';
import { ToastService } from '../../services/toast.service';
import { Deck, Flashcard } from '../../models/interfaces';
import { ModalComponent } from '../../components/modal/modal.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../components/error-state/error-state.component';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { BadgeComponent } from '../../components/badge/badge.component';
import { ConfirmDeleteComponent } from '../../components/confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-deck-detail-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, ModalComponent, EmptyStateComponent, ErrorStateComponent, BadgeComponent, ConfirmDeleteComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading -->
      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-8 w-48"></div>
          <div class="skeleton h-4 w-64"></div>
          <div class="skeleton h-4 w-64"></div>
          <div class="skeleton h-12 w-full rounded-lg mt-6"></div>
          @for (i of [1,2,3]; track i) {
            <div class="skeleton h-20 w-full rounded-lg"></div>
          }
        </div>
      }

      <!-- Error -->
      @if (error(); as err) {
        <app-error-state [message]="err" retryLabel="Go Back" (retry)="router.navigate(['/dashboard'])" />
      }

      @if (!loading() && !error()) {
        <div>
          <!-- Back button -->
          <a routerLink="/dashboard" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Dashboard
          </a>

          <!-- Deck Header -->
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ deck()?.name }}</h1>
                @if (deck()?.description) {
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ deck()?.description }}</p>
                }
              </div>
              <div class="flex gap-2">
                <button (click)="editDeck()" class="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit deck">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button (click)="showDeleteDeck.set(true)" class="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Delete deck">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-6">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-gray-600 dark:text-gray-400">Progress</span>
                <span class="text-gray-500 dark:text-gray-400">{{ studiedCount() }} / {{ deck()?.cardCount || 0 }} studied</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
                <div
                  class="bg-primary-600 dark:bg-primary-400 h-2.5 rounded-full transition-all duration-500"
                  [style.width.%]="progressPercent()"
                ></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-3 mt-6">
              <a [routerLink]="['/study', deckId()]" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Study Now
              </a>
              <a [routerLink]="['/quiz', deckId()]" class="px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 text-sm font-medium rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Take Quiz
              </a>
              <a [routerLink]="['/ai-generate', deckId()]" class="px-4 py-2 border border-secondary-600 text-secondary-600 dark:text-secondary-400 dark:border-secondary-400 text-sm font-medium rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-900/30 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                AI Generate
              </a>
              <button (click)="showCreateCard.set(true)" class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Create Card
              </button>
            </div>
          </div>

          <!-- Flashcards List -->
          @if (flashcardsLoading()) {
            <div class="space-y-3">
              @for (i of [1,2,3,4]; track i) {
                <div class="skeleton h-20 w-full rounded-lg"></div>
              }
            </div>
          }

          @if (flashcards().length === 0 && !flashcardsLoading()) {
            <app-empty-state
              icon="🃏"
              title="No flashcards yet"
              description="Add your first flashcard or use AI to generate them."
              actionLabel="Create Card"
              (action)="showCreateCard.set(true)"
            />
          }

          @if (flashcards().length > 0 && !flashcardsLoading()) {
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Flashcards ({{ flashcards().length }})</h2>
            <div class="space-y-3">
              @for (card of flashcards(); track card.id) {
                <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{{ card.front }}</p>
                      <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{{ card.back }}</p>
                    </div>
                    <div class="flex items-center gap-2 ml-4 shrink-0">
                      @if (card.difficulty) {
                        <app-badge
                          [variant]="card.difficulty === 'easy' ? 'easy' : card.difficulty === 'medium' ? 'medium' : card.difficulty === 'hard' ? 'hard' : 'default'"
                          [text]="card.difficulty"
                        />
                      }
                      <button (click)="editCard(card)" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button (click)="deleteCard(card.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Create/Edit Card Modal -->
      <app-modal
        [open]="showCreateCard() || showEditCard()"
        [title]="editingCard() ? 'Edit Card' : 'Create Card'"
        size="md"
        (close)="closeCardModal()"
      >
        <form [formGroup]="cardForm" (ngSubmit)="saveCard()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Front (Question)</label>
            <textarea
              formControlName="front"
              placeholder="Enter the question or term"
              rows="3"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Back (Answer)</label>
            <textarea
              formControlName="back"
              placeholder="Enter the answer or definition"
              rows="3"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
            ></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeCardModal()" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" [disabled]="cardForm.invalid" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors">
              {{ editingCard() ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Edit Deck Modal -->
      <app-modal
        [open]="showEditDeckModal()"
        title="Edit Deck"
        size="sm"
        (close)="showEditDeckModal.set(false)"
      >
        <form [formGroup]="editDeckForm" (ngSubmit)="saveDeckEdit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deck Name</label>
            <input type="text" formControlName="name" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea formControlName="description" rows="3" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="showEditDeckModal.set(false)" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="submit" [disabled]="editDeckForm.invalid" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors">Save</button>
          </div>
        </form>
      </app-modal>

      <!-- Delete Deck Confirmation -->
      @if (showDeleteDeck()) {
        <app-confirm-delete
          title="Delete Deck"
          message="Are you sure you want to delete this deck and all its flashcards?"
          [itemName]="deck()?.name || ''"
          (confirmed)="confirmDeleteDeck()"
          (cancelled)="showDeleteDeck.set(false)"
        />
      }
    </div>
  `,
})
export class DeckDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly deckStore = inject(DeckStoreService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly deckId = signal<number>(0);
  protected readonly deck = signal<Deck | null>(null);
  protected readonly flashcards = signal<Flashcard[]>([]);
  protected readonly loading = signal(true);
  protected readonly flashcardsLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showCreateCard = signal(false);
  protected readonly showEditCard = signal(false);
  protected readonly editingCard = signal<Flashcard | null>(null);
  protected readonly showEditDeckModal = signal(false);
  protected readonly showDeleteDeck = signal(false);

  protected readonly cardForm = this.fb.group({
    front: ['', Validators.required],
    back: ['', Validators.required],
  });

  protected readonly editDeckForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  protected readonly studiedCount = computed(() => {
    // We'll calculate from API data if available
    return 0;
  });

  protected readonly progressPercent = computed(() => {
    const total = this.deck()?.cardCount || 0;
    if (total === 0) return 0;
    return Math.min(100, Math.round((this.studiedCount() / total) * 100));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.deckId.set(id);
    this.loadDeck();
    this.loadFlashcards();
  }

  private loadDeck(): void {
    this.loading.set(true);
    this.error.set(null);
    firstValueFrom(this.api.get<Deck>(`/decks/${this.deckId()}`))
      .then((deck) => {
        this.deck.set(deck);
        this.editDeckForm.patchValue({ name: deck.name, description: deck.description || '' });
        this.loading.set(false);
      })
      .catch((err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Failed to load deck');
      });
  }

  private loadFlashcards(): void {
    this.flashcardsLoading.set(true);
    firstValueFrom(this.api.get<Flashcard[]>(`/decks/${this.deckId()}/flashcards`))
      .then((cards) => {
        this.flashcards.set(cards);
        this.flashcardsLoading.set(false);
      })
      .catch(() => {
        this.flashcards.set([]);
        this.flashcardsLoading.set(false);
      });
  }

  editDeck(): void {
    this.showEditDeckModal.set(true);
  }

  saveDeckEdit(): void {
    if (this.editDeckForm.invalid) return;
    const { name, description } = this.editDeckForm.value;
    this.deckStore.update(this.deckId(), { name: name!, description: description || undefined }).then(() => {
      this.showEditDeckModal.set(false);
      this.loadDeck();
    });
  }

  confirmDeleteDeck(): void {
    this.deckStore.delete(this.deckId()).then(() => {
      this.router.navigate(['/dashboard']);
    });
  }

  editCard(card: Flashcard): void {
    this.editingCard.set(card);
    this.cardForm.patchValue({ front: card.front, back: card.back });
    this.showEditCard.set(true);
  }

  closeCardModal(): void {
    this.showCreateCard.set(false);
    this.showEditCard.set(false);
    this.editingCard.set(null);
    this.cardForm.reset();
  }

  saveCard(): void {
    if (this.cardForm.invalid) return;
    const { front, back } = this.cardForm.value;
    const editCard = this.editingCard();

    const request = editCard
      ? this.api.put<Flashcard>(`/cards/${editCard.id}`, { front, back })
      : this.api.post<Flashcard>(`/decks/${this.deckId()}/flashcards`, { front, back });

    firstValueFrom(request)
      .then(() => {
        this.toast.show(editCard ? 'Card updated!' : 'Card created!', 'success');
        this.closeCardModal();
        this.loadFlashcards();
        this.loadDeck();
      })
      .catch((err) => {
        this.toast.show(err.error?.message || 'Failed to save card', 'error');
      });
  }

  deleteCard(cardId: number): void {
    firstValueFrom(this.api.delete<void>(`/cards/${cardId}`))
      .then(() => {
        this.toast.show('Card deleted.', 'info');
        this.flashcards.update((cards) => cards.filter((c) => c.id !== cardId));
        this.loadDeck();
      })
      .catch((err) => {
        this.toast.show(err.error?.message || 'Failed to delete card', 'error');
      });
  }
}
