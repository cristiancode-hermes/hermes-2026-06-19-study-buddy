# Frontend Architecture — Study Buddy

## Signal Architecture

### State Management Strategy

The app uses **signal-first state management** — every reactive value is a `signal()`, every derived value is a `computed()`, and side effects are explicit.

```
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  AuthService     DeckStore     StudyService    ThemeService│
│  (signals)       (signals)     (signals)        (signals)│
└────────┬────────────┬──────────────┬──────────────┬──────┘
         │            │              │              │
         ▼            ▼              ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                  Component Layer                          │
│  Dashboard      DeckDetail     Study         AI Generate  │
│  (inject +     (inject +      (inject +      (inject +   │
│   computed)     computed)      computed)      computed)   │
└─────────────────────────────────────────────────────────┘
```

### Global Services

All services use `providedIn: 'root'` and store state as signals:

```typescript
// AuthService — authentication state
readonly user = signal<User | null>(null);
readonly token = signal<string | null>(localStorage.getItem('token'));
readonly isAuthenticated = computed(() => this.token() !== null);
readonly loading = signal(false);

// DeckStore — deck data + stats
readonly decks = signal<Deck[]>([]);
readonly loading = signal(false);
readonly error = signal<string | null>(null);
readonly isEmpty = computed(() => !this.loading() && this.decks().length === 0);
readonly stats = computed(() => ({ total: ..., dueToday: ..., totalCards: ... }));

// StudyService — study session state
readonly dueCards = signal<StudyCard[]>([]);
readonly currentIndex = signal(0);
readonly isFlipped = signal(false);
readonly sessionComplete = signal(false);
readonly sessionStats = signal({ viewed: 0, correct: 0 });

// ThemeService — dark mode
readonly isDark = signal(localStorage.getItem('study-buddy-theme') === 'dark');
toggle(): void { ... }
```

### Component State Pattern

Each page component follows the **loading/error/empty/data** pattern:

```typescript
@Component({ ... })
export class DashboardPageComponent {
  protected readonly deckStore = inject(DeckStoreService);

  // Local UI state
  protected readonly searchQuery = signal('');

  // Derived (computed)
  protected readonly filteredDecks = computed(() =>
    this.deckStore.decks().filter(d =>
      d.name.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  // Template uses @if / @for
  // @if (deckStore.loading()) → skeleton
  // @else if (deckStore.error()) → error-state
  // @else if (deckStore.isEmpty()) → empty-state
  // @else → @for deck of filteredDecks() → deck cards
}
```

### Loading/Empty/Error States

Every page handles all three states:

```html
@if (loading()) {
  <app-spinner size="lg" />
} @else if (error()) {
  <app-error-state [message]="error()!" (retry)="loadData()" />
} @else if (isEmpty()) {
  <app-empty-state
    icon="book-open"
    title="No items yet"
    description="Create your first item to get started"
    actionLabel="Create"
    (action)="openCreateModal()"
  />
} @else {
  <!-- actual data display -->
  @for (item of items(); track item.id) {
    <app-item-card [item]="item" />
  }
}
```

## Zoneless Change Detection

The app uses `provideZonelessChangeDetection()` in `app.config.ts`:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

Key implications:

1. **No NgZone** — all change detection is triggered by signal changes
2. **No `setTimeout`/`setInterval` trigger CD** — signals handle reactivity
3. **`markForCheck` not needed** — signals notify Angular automatically
4. **Async pipes not needed** — signals + `@if`/`@for` handle data binding

## Lazy Loading

Each page is a separate chunk loaded on demand:

| Chunk | Route | Page |
|-------|-------|------|
| `login-page-component` | `/login` | Login |
| `register-page-component` | `/register` | Register |
| `dashboard-page-component` | `/dashboard` | Dashboard |
| `deck-detail-page-component` | `/dashboard/decks/:id` | Deck Detail |
| `study-page-component` | `/study/:deckId` | Study Mode |
| `ai-generate-page-component` | `/ai-generate` | AI Generator |
| `quiz-page-component` | `/quiz/:deckId` | Quiz Mode |
| `settings-page-component` | `/settings` | Settings |

## Form Handling

Use Angular reactive forms (`FormBuilder`, `FormGroup`) for complex forms:

```typescript
protected readonly generateForm = this.fb.group({
  deckId: [0, Validators.required],
  notes: ['', Validators.required],
});
```

For simple UI state (search, toggles), use plain `signal()`:

```typescript
protected readonly searchQuery = signal('');
protected readonly isFlipped = signal(false);
```
