import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Deck } from '../../models/interfaces';
import { GeneratedCard } from '../../models/interfaces';
import { DeckStoreService } from '../../services/deck-store.service';
import { ModalComponent } from '../../components/modal/modal.component';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
@Component({
  selector: 'app-ai-generate-page',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, SpinnerComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Flashcard Generator</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Paste your notes and let AI create flashcards for you.</p>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-8">
        <form [formGroup]="generateForm" (ngSubmit)="onGenerate()" class="space-y-4">
          <!-- Deck Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Deck</label>
            <select formControlName="deckId" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm">
              <option value="">-- Select a deck --</option>
              @for (deck of deckStore.decks(); track deck.id) {
                <option [value]="deck.id">{{ deck.name }} ({{ deck.cardCount }} cards)</option>
              }
            </select>
          </div>

          <!-- Text Area -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Notes</label>
            <textarea
              formControlName="notes"
              placeholder="Paste your study notes, textbook excerpts, or any content you want to turn into flashcards..."
              rows="8"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-y"
            ></textarea>
          </div>

          @if (generateError()) {
            <div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
              {{ generateError() }}
            </div>
          }

          <button
            type="submit"
            [disabled]="generateForm.invalid || generating()"
            class="w-full py-2.5 px-4 bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            @if (generating()) {
              <app-spinner size="sm" />
              Generating with AI...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              Generate Flashcards
            }
          </button>
        </form>
      </div>

      <!-- Loading Skeleton -->
      @if (generating()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div class="skeleton h-4 w-3/4 mb-2"></div>
              <div class="skeleton h-4 w-1/2"></div>
            </div>
          }
        </div>
      }

      <!-- Generated Cards Review -->
      @if (generatedCards().length > 0 && !generating()) {
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generated Cards ({{ selectedCount() }}/{{ generatedCards().length }} selected)
            </h2>
            <button
              (click)="saveSelected()"
              [disabled]="selectedCount() === 0"
              class="px-4 py-2 bg-accent-600 hover:bg-accent-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Save {{ selectedCount() }} Cards
            </button>
          </div>

          <div class="space-y-3">
            @for (card of generatedCards(); track card; let i = $index) {
              <div
                class="bg-white dark:bg-gray-900 rounded-xl border p-4 transition-all cursor-pointer"
                [class]="card.selected ? 'border-primary-400 dark:border-primary-600 ring-2 ring-primary-200 dark:ring-primary-800' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'"
                (click)="toggleCard(i)"
              >
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 shrink-0">
                    <div
                      class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                      [class]="card.selected ? 'bg-primary-600 border-primary-600' : 'border-gray-400 dark:border-gray-500'"
                    >
                      @if (card.selected) {
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      }
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Front</span>
                      <button (click)="$event.stopPropagation(); editCard(i)" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                    </div>
                    <p class="text-sm text-gray-900 dark:text-gray-100 mb-3">{{ card.front }}</p>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Back</span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ card.back }}</p>
                  </div>
                  <button
                    (click)="$event.stopPropagation(); removeCard(i)"
                    class="shrink-0 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Edit Card Modal -->
      <app-modal
        [open]="showEditModal()"
        title="Edit Card"
        size="md"
        (close)="closeEditModal()"
      >
        <form [formGroup]="editForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Front</label>
            <textarea formControlName="front" rows="3" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Back</label>
            <textarea formControlName="back" rows="3" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeEditModal()" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="button" (click)="saveEdit()" [disabled]="editForm.invalid" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors">Save</button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
})
export class AiGeneratePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  protected readonly deckStore = inject(DeckStoreService);
  private readonly toast = inject(ToastService);

  protected readonly generatedCards = signal<GeneratedCard[]>([]);
  protected readonly generating = signal(false);
  protected readonly generateError = signal<string | null>(null);
  protected readonly showEditModal = signal(false);
  protected readonly editingIndex = signal<number>(-1);

  protected readonly generateForm = this.fb.group({
    deckId: [0, Validators.required],
    notes: ['', Validators.required],
  });

  protected readonly editForm = this.fb.group({
    front: ['', Validators.required],
    back: ['', Validators.required],
  });

  protected readonly selectedCount = computed(() =>
    this.generatedCards().filter((c) => c.selected).length
  );

  ngOnInit(): void {
    this.deckStore.loadAll();
    const deckId = this.route.snapshot.paramMap.get('deckId');
    if (deckId) {
      this.generateForm.patchValue({ deckId: Number(deckId) });
    }
  }

  onGenerate(): void {
    if (this.generateForm.invalid) return;
    const { deckId, notes } = this.generateForm.value;
    this.generating.set(true);
    this.generateError.set(null);

    firstValueFrom(
      this.api.post<GeneratedCard[]>('/ai/generate', { deckId, notes }),
    )
      .then((cards) => {
        this.generatedCards.set(cards.map((c) => ({ ...c, selected: true })));
        this.generating.set(false);
      })
      .catch((err) => {
        this.generating.set(false);
        this.generateError.set(err.error?.message || err.message || 'AI generation failed. Please try again.');
      });
  }

  toggleCard(index: number): void {
    this.generatedCards.update((cards) =>
      cards.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  }

  editCard(index: number): void {
    this.editingIndex.set(index);
    const card = this.generatedCards()[index];
    this.editForm.patchValue({ front: card.front, back: card.back });
    this.showEditModal.set(true);
  }

  saveEdit(): void {
    if (this.editForm.invalid) return;
    const idx = this.editingIndex();
    const { front, back } = this.editForm.value;
    this.generatedCards.update((cards) =>
      cards.map((c, i) => (i === idx ? { ...c, front: front!, back: back! } : c))
    );
    this.closeEditModal();
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingIndex.set(-1);
    this.editForm.reset();
  }

  removeCard(index: number): void {
    this.generatedCards.update((cards) => cards.filter((_, i) => i !== index));
  }

  saveSelected(): void {
    const selected = this.generatedCards().filter((c) => c.selected);
    const deckId = this.generateForm.value.deckId;
    if (!deckId || selected.length === 0) return;

    firstValueFrom(
      this.api.post<{ saved: number }>(`/decks/${deckId}/flashcards/bulk`, {
        cards: selected.map((c) => ({ front: c.front, back: c.back })),
      }),
    )
      .then((res) => {
        this.toast.show(`${res.saved} cards saved to deck!`, 'success');
        this.generatedCards.set([]);
      })
      .catch((err) => {
        this.toast.show(err.error?.message || 'Failed to save cards', 'error');
      });
  }
}
