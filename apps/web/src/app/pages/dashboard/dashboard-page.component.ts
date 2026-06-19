import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DeckStoreService } from '../../services/deck-store.service';
import { ModalComponent } from '../../components/modal/modal.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../components/error-state/error-state.component';
import { BadgeComponent } from '../../components/badge/badge.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ReactiveFormsModule, ModalComponent, EmptyStateComponent, ErrorStateComponent, BadgeComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's your study overview.</p>
        </div>
        <button
          (click)="showCreateModal.set(true)"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New Deck
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600 dark:text-primary-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Total Decks</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ deckStore.stats().totalDecks }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-600 dark:text-accent-400"><path d="M22 10v6M2 10l10-5 10 5-10 5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Total Cards</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ deckStore.stats().totalCards }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 dark:text-yellow-400"><path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Due Today</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ deckStore.stats().dueToday }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (deckStore.loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (item of [1,2,3,4,5,6]; track item) {
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div class="skeleton h-5 w-3/4 mb-3"></div>
              <div class="skeleton h-3 w-1/2 mb-4"></div>
              <div class="skeleton h-3 w-full mb-2"></div>
              <div class="flex gap-2 mt-4">
                <div class="skeleton h-8 w-16 rounded-lg"></div>
                <div class="skeleton h-8 w-16 rounded-lg"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error State -->
      @if (deckStore.error(); as error) {
        <app-error-state
          [message]="error"
          retryLabel="Try Again"
          (retry)="deckStore.loadAll()"
        />
      }

      <!-- Empty State -->
      @if (!deckStore.loading() && !deckStore.error() && deckStore.isEmpty()) {
        <app-empty-state
          icon="📚"
          title="No decks yet"
          description="Create your first deck to start studying!"
          actionLabel="Create Deck"
          (action)="showCreateModal.set(true)"
        />
      }

      <!-- Deck Grid -->
      @if (!deckStore.loading() && !deckStore.isEmpty()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (deck of filteredDecks(); track deck.id) {
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ deck.name }}</h3>
                <app-badge
                  [variant]="deck.dueCount > 0 ? 'medium' : 'easy'"
                  [text]="deck.dueCount + ' due'"
                />
              </div>
              @if (deck.description) {
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{{ deck.description }}</p>
              }
              <div class="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-4">
                <span>{{ deck.cardCount }} cards</span>
                <span>{{ deck.createdAt | date }}</span>
              </div>
              <div class="flex gap-2">
                <a [routerLink]="['/study', deck.id]" class="flex-1 text-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors">
                  Study
                </a>
                <a [routerLink]="['/quiz', deck.id]" class="flex-1 text-center px-3 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 text-xs font-medium rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                  Quiz
                </a>
                <a [routerLink]="['/dashboard/decks', deck.id]" class="px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Details
                </a>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create Deck Modal -->
      <app-modal
        [open]="showCreateModal()"
        title="Create New Deck"
        size="sm"
        (close)="showCreateModal.set(false)"
      >
        <form [formGroup]="createForm" (ngSubmit)="onCreate()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deck Name</label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g., Spanish Vocabulary"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
            <textarea
              formControlName="description"
              placeholder="Brief description..."
              rows="3"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
            ></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="showCreateModal.set(false)" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" [disabled]="createForm.invalid" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors">
              Create
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
})
export class DashboardPageComponent {
  protected readonly deckStore = inject(DeckStoreService);
  private readonly fb = inject(FormBuilder);

  protected readonly showCreateModal = signal(false);
  protected readonly searchQuery = signal('');

  protected readonly createForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  protected readonly filteredDecks = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.deckStore.decks();
    return this.deckStore.decks().filter((d) =>
      d.name.toLowerCase().includes(query) ||
      (d.description && d.description.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.deckStore.loadAll();
  }

  onCreate(): void {
    if (this.createForm.invalid) return;
    const { name, description } = this.createForm.value;
    this.deckStore.create(name!, description || undefined).then(() => {
      this.showCreateModal.set(false);
      this.createForm.reset();
    });
  }
}
