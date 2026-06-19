import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { QuizQuestion } from '../../models/interfaces';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { ErrorStateComponent } from '../../components/error-state/error-state.component';

type QuizPhase = 'setup' | 'playing' | 'results';

@Component({
  selector: 'app-quiz-page',
  standalone: true,
  imports: [RouterLink, SpinnerComponent, ErrorStateComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back -->
      <a [routerLink]="['/dashboard']" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Dashboard
      </a>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <app-spinner size="lg" />
        </div>
      }

      <!-- Error -->
      @if (error(); as err) {
        <app-error-state [message]="err" retryLabel="Go Back" (retry)="router.navigate(['/dashboard'])" />
      }

      @if (!loading() && !error()) {
        <!-- Setup Phase -->
        @if (phase() === 'setup') {
          <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600 dark:text-primary-400"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Quiz Time!</h2>
            <p class="text-gray-500 dark:text-gray-400 mb-8">Test your knowledge with {{ totalCards() }} cards available.</p>

            <div class="flex justify-center gap-3 mb-8">
              @for (opt of questionOptions; track opt.value) {
                <button
                  (click)="selectQuestionCount(opt.value)"
                  class="px-6 py-3 rounded-xl border-2 font-medium transition-all"
                  [class]="selectedCount() === opt.value
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'"
                >
                  {{ opt.label }}
                </button>
              }
            </div>

            <button
              (click)="startQuiz()"
              class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Start Quiz
            </button>
          </div>
        }

        <!-- Playing Phase -->
        @if (phase() === 'playing') {
          <div>
            <!-- Progress -->
            <div class="flex items-center justify-between mb-6">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Question {{ currentQuestion() + 1 }} of {{ questions().length }}</span>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">Score: {{ score() }}/{{ currentQuestion() }}</span>
              </div>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-8">
              <div
                class="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                [style.width.%]="((currentQuestion() + 1) / questions().length * 100)"
              ></div>
            </div>

            <!-- Question Card -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-6">
              <span class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Question {{ currentQuestion() + 1 }}</span>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{{ currentQ()?.question }}</h3>

              <div class="space-y-3">
                @for (option of currentQ()?.options || []; track option; let i = $index) {
                  <button
                    (click)="selectAnswer(i)"
                    [disabled]="answered()"
                    class="w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium"
                    [class]="getOptionClass(i)"
                  >
                    <span class="flex items-center gap-3">
                      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        [class]="getOptionIndicatorClass(i)">
                        {{ ['A', 'B', 'C', 'D'][i] }}
                      </span>
                      {{ option }}
                    </span>
                  </button>
                }
              </div>

              @if (answered()) {
                <button
                  (click)="nextQuestion()"
                  class="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  {{ currentQuestion() === questions().length - 1 ? 'See Results' : 'Next Question' }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Results Phase -->
        @if (phase() === 'results') {
          <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <div class="text-6xl mb-4">{{ scorePercentage() >= 80 ? '🏆' : scorePercentage() >= 50 ? '👍' : '💪' }}</div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Quiz Complete!</h2>
            <p class="text-gray-500 dark:text-gray-400 mb-8">Here's how you did</p>

            <div class="flex items-center justify-center gap-8 mb-8">
              <div class="text-center">
                <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ score() }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Correct</p>
              </div>
              <div class="text-center">
                <p class="text-3xl font-bold text-red-500">{{ questions().length - score() }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Incorrect</p>
              </div>
              <div class="text-center">
                <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">{{ scorePercentage() }}%</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
              </div>
            </div>

            <!-- Wrong Answers Review -->
            @if (wrongAnswers().length > 0) {
              <div class="text-left mb-8">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Review Incorrect Answers</h3>
                <div class="space-y-3">
                  @for (wa of wrongAnswers(); track wa) {
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{{ wa.question }}</p>
                      <p class="text-xs text-red-600 dark:text-red-400 mb-1">Your answer: {{ wa.yourAnswer }}</p>
                      <p class="text-xs text-green-600 dark:text-green-400">Correct answer: {{ wa.correctAnswer }}</p>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="flex gap-3 justify-center">
              <button (click)="resetQuiz()" class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                Try Again
              </button>
              <a [routerLink]="['/dashboard']" class="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Dashboard
              </a>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class QuizPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  protected readonly phase = signal<QuizPhase>('setup');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCards = signal(0);
  protected readonly selectedCount = signal(5);
  protected readonly questions = signal<QuizQuestion[]>([]);
  protected readonly currentQuestion = signal(0);
  protected readonly selectedAnswer = signal<number | null>(null);
  protected readonly answered = signal(false);
  protected readonly score = signal(0);
  protected readonly wrongAnswers = signal<Array<{ question: string; yourAnswer: string; correctAnswer: string }>>([]);

  protected readonly questionOptions = [
    { label: '5 Questions', value: 5 },
    { label: '10 Questions', value: 10 },
    { label: '15 Questions', value: 15 },
    { label: 'All', value: 0 },
  ];

  protected readonly currentQ = computed(() => {
    const qs = this.questions();
    const idx = this.currentQuestion();
    return idx < qs.length ? qs[idx] : null;
  });

  protected readonly scorePercentage = computed(() => {
    const total = this.questions().length;
    if (total === 0) return 0;
    return Math.round((this.score() / total) * 100);
  });

  ngOnInit(): void {
    const deckId = Number(this.route.snapshot.paramMap.get('deckId'));
    this.loading.set(true);
    firstValueFrom(this.api.get<{ totalCards: number }>(`/decks/${deckId}/quiz-info`))
      .then((info) => {
        this.totalCards.set(info.totalCards);
        this.loading.set(false);
      })
      .catch((err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to load quiz info');
      });
  }

  selectQuestionCount(count: number): void {
    this.selectedCount.set(count);
  }

  startQuiz(): void {
    const deckId = Number(this.route.snapshot.paramMap.get('deckId'));
    const count = this.selectedCount();
    this.loading.set(true);

    firstValueFrom(
      this.api.post<QuizQuestion[]>(`/decks/${deckId}/quiz`, {
        count: count === 0 ? undefined : count,
      }),
    )
      .then((questions) => {
        this.questions.set(questions);
        this.phase.set('playing');
        this.loading.set(false);
      })
      .catch((err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to generate quiz');
      });
  }

  selectAnswer(index: number): void {
    if (this.answered()) return;
    this.answered.set(true);
    this.selectedAnswer.set(index);

    const q = this.currentQ();
    if (!q) return;

    if (index === q.correctIndex) {
      this.score.update((s) => s + 1);
    } else {
      this.wrongAnswers.update((wa) => [
        ...wa,
        {
          question: q.question,
          yourAnswer: q.options[index],
          correctAnswer: q.options[q.correctIndex],
        },
      ]);
    }
  }

  nextQuestion(): void {
    const next = this.currentQuestion() + 1;
    if (next >= this.questions().length) {
      this.phase.set('results');
    } else {
      this.currentQuestion.set(next);
      this.answered.set(false);
      this.selectedAnswer.set(null);
    }
  }

  resetQuiz(): void {
    this.phase.set('setup');
    this.currentQuestion.set(0);
    this.answered.set(false);
    this.selectedAnswer.set(null);
    this.score.set(0);
    this.wrongAnswers.set([]);
    this.questions.set([]);
    this.selectedCount.set(5);
  }

  getOptionClass(i: number): string {
    if (!this.answered()) {
      return 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20';
    }
    const q = this.currentQ();
    if (!q) return '';
    if (i === q.correctIndex) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    }
    if (i === this.selectedAnswer() && i !== q.correctIndex) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    }
    return 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 opacity-50';
  }

  getOptionIndicatorClass(i: number): string {
    if (!this.answered()) {
      return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
    }
    const q = this.currentQ();
    if (!q) return '';
    if (i === q.correctIndex) {
      return 'bg-green-500 text-white';
    }
    if (i === this.selectedAnswer() && i !== q.correctIndex) {
      return 'bg-red-500 text-white';
    }
    return 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
  }
}
