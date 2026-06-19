import { Component, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { StudyService } from '../../services/study.service';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../components/error-state/error-state.component';

@Component({
  selector: 'app-study-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, SpinnerComponent, EmptyStateComponent, ErrorStateComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back button -->
      <a [routerLink]="['/dashboard']" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Dashboard
      </a>

      <!-- Loading -->
      @if (studyService.isLoading()) {
        <div class="flex items-center justify-center py-20">
          <app-spinner size="lg" />
        </div>
      }

      <!-- Error -->
      @if (studyService.error(); as err) {
        <app-error-state [message]="err" retryLabel="Go Back" (retry)="router.navigate(['/dashboard'])" />
      }

      <!-- Empty: No cards due -->
      @if (!studyService.isLoading() && !studyService.error() && studyService.dueCards().length === 0 && !studyService.sessionComplete()) {
        <app-empty-state
          icon="🎉"
          title="No cards due today!"
          description="Great job! You're all caught up. Come back later or create new cards."
          actionLabel="Back to Dashboard"
          (action)="router.navigate(['/dashboard'])"
        />
      }

      <!-- Session Complete -->
      @if (studyService.sessionComplete()) {
        <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Session Complete!</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">Great studying!</p>
          <div class="flex items-center justify-center gap-8 mb-8">
            <div class="text-center">
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ studyService.sessionStats().viewed }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Cards Reviewed</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-accent-600 dark:text-accent-400">{{ studyService.sessionStats().correct }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Correct</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ studyService.sessionStats().viewed > 0 ? (studyService.sessionStats().correct / studyService.sessionStats().viewed * 100 | number:'1.0-0') : 0 }}%
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
            </div>
          </div>
          <div class="flex gap-3 justify-center">
            <a [routerLink]="['/dashboard']" class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
              Back to Dashboard
            </a>
            <a [routerLink]="['/dashboard/decks', deckId()]" class="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Deck Details
            </a>
          </div>
        </div>
      }

      <!-- Active Study Session -->
      @if (!studyService.isLoading() && !studyService.error() && studyService.dueCards().length > 0 && !studyService.sessionComplete()) {
        <div>
          <!-- Progress -->
          <div class="flex items-center justify-between mb-6">
            <span class="text-sm text-gray-500 dark:text-gray-400">Card {{ studyService.progress().current }} of {{ studyService.progress().total }}</span>
            <div class="w-32 bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <div
                class="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                [style.width.%]="(studyService.progress().current / studyService.progress().total * 100)"
              ></div>
            </div>
          </div>

          <!-- Flashcard -->
          <div class="perspective mb-8">
            <div
              (click)="studyService.flipCard()"
              class="relative w-full cursor-pointer transform-style-3d transition-transform duration-500"
              [class.rotate-y-180]="studyService.isFlipped()"
              style="min-height: 320px;"
            >
              <!-- Front -->
              <div class="absolute inset-0 backface-hidden">
                <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-8 flex flex-col items-center justify-center min-h-[320px]">
                  <span class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Question</span>
                  <p class="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center leading-relaxed">{{ studyService.currentCard()?.front }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-6">Click to reveal answer</p>
                </div>
              </div>
              <!-- Back -->
              <div class="absolute inset-0 backface-hidden rotate-y-180">
                <div class="bg-primary-50 dark:bg-primary-950/30 rounded-2xl border border-primary-200 dark:border-primary-800 shadow-lg p-8 flex flex-col items-center justify-center min-h-[320px]">
                  <span class="text-xs font-medium text-primary-400 uppercase tracking-wider mb-4">Answer</span>
                  <p class="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center leading-relaxed">{{ studyService.currentCard()?.back }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Rating Buttons (only visible after flip) -->
          @if (studyService.isFlipped()) {
            <div class="flex justify-center gap-4">
              <button
                (click)="rateCard(0)"
                class="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 16-4-4-4 4M12 12V8"/></svg>
                <span class="text-xs font-medium">Difícil</span>
              </button>
              <button
                (click)="rateCard(3)"
                class="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2M6 12h2M10 12h2"/><path d="M12 18h.01"/><path d="M17 6.5a4.5 4.5 0 0 1 5 0V11a2 2 0 0 1-2 2h-2"/><path d="M14 14.5a2.5 2.5 0 0 1 5 0V17"/><path d="M20 17v1a2 2 0 0 1-2 2h-4.5"/><path d="M5.5 12h-1A.5.5 0 0 0 4 12.5V16a2 2 0 0 0 2 2h1"/></svg>
                <span class="text-xs font-medium">Media</span>
              </button>
              <button
                (click)="rateCard(5)"
                class="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span class="text-xs font-medium">Fácil</span>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StudyPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly studyService = inject(StudyService);

  protected readonly deckId = signal<number>(0);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('deckId'));
    this.deckId.set(id);
    this.studyService.loadDueCards(id);
  }

  rateCard(quality: number): void {
    const card = this.studyService.currentCard();
    if (!card) return;

    this.studyService.submitRating(card.id, quality).then(() => {
      this.studyService.nextCard();
    });
  }
}
