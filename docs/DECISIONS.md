# Design Decisions — Study Buddy

All Architectural Decision Records for this project.

---

## ADR-1: Signal-First Angular Architecture

**Context:** Angular 22 introduces stable signals, zoneless change detection, and signal-based component APIs. Previous projects used a mix of signals and RxJS.

**Decision:** Use signals for ALL component state, `computed()` for derived values, and `effect()` only when justified (commented). Use `input()`/`output()` instead of `@Input()`/`@Output()`.

**Consequences:**
- (+) Fine-grained reactivity without Zone.js overhead
- (+) Consistent pattern across all components
- (-) ngModel has edge cases with signals — use plain properties or reactive forms for form bindings

---

## ADR-2: AI Strategy Pattern

**Context:** The project requires AI-powered flashcard generation and quiz creation, but OPENAI_API_KEY may not be available in all environments (local dev, CI, cron runs without credentials).

**Decision:** Use Strategy Pattern with `AIStrategy` interface. Two implementations:
- `OpenAIStrategy`: Real LLM API call (when OPENAI_API_KEY is set)
- `LocalFallbackStrategy`: Rule-based extraction with sentence splitting and paragraph analysis

**Consequences:**
- (+) AI features work even without an API key
- (+) New AI providers (Anthropic, Gemini, local models) can be added by implementing the same interface
- (-) Local fallback produces lower-quality flashcards compared to LLM
- (-) Strategy Pattern adds architectural complexity

---

## ADR-3: SQLite with PostgreSQL-Compatible Schema

**Context:** NEON_API_KEY is unavailable in the cron environment (8th consecutive run). The app must work locally without Neon.

**Decision:** Use better-sqlite3 for development with a PostgreSQL-compatible schema. All types, queries, and migrations are designed to work with both databases. The switch to Neon requires only changing the TypeORM config.

**Consequences:**
- (+) Fully functional locally without external database
- (+) Easy path to production — just change connection string and enable migrations
- (-) Some PostgreSQL-specific features (pgvector, partitioning) cannot be tested locally
- (-) strftime() vs EXTRACT() requires env-aware queries

---

## ADR-4: SM-2 Algorithm for Spaced Repetition

**Context:** The spaced repetition algorithm is the core learning feature. Options include SM-2 (simple, proven), FSRS (modern, complex), or custom.

**Decision:** Implement SM-2 as specified by SuperMemo in 1987. It's well-documented, computationally simple, and proven effective over decades.

**Consequences:**
- (+) Simple implementation (~30 lines of code)
- (+) Well-understood behavior with predictable results
- (-) Less optimal than modern algorithms like FSRS
- (-) Fixed ease factor bounds may not adapt to all learners

### SM-2 Implementation Details
```typescript
if (quality >= 3) {
  if (repetitions === 0) interval = 1;
  else if (repetitions === 1) interval = 6;
  else interval = Math.round(interval * easeFactor);
  repetitions++;
} else {
  interval = 1;
  repetitions = 0;
}
easeFactor = max(1.3, EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02)));
```

---

## ADR-5: Lazy-Loaded Pages with Auth Guard

**Context:** The app has 8 pages, many requiring authentication. Angular 22 supports lazy loading with `loadComponent`.

**Decision:** Each page is a separate lazy-loaded chunk. Auth guard prevents unauthenticated access and redirects to `/login`.

**Consequences:**
- (+) Initial bundle is under 300KB (compared to ~500KB with eager loading)
- (+) 10 separate chunks loaded on demand
- (+) Clear security boundary — auth check before any page code loads
- (-) Slight navigation delay when first visiting a page (chunk download)

---

## ADR-6: Tailwind CSS v4 with Custom Theme

**Context:** The design specs define a complete design system with brand colors, typography, spacing, shadows, and dark mode tokens.

**Decision:** Use Tailwind CSS v4's `@theme` directive to define custom tokens in styles.css. No component CSS files — all styling via Tailwind utility classes.

**Consequences:**
- (+) Design system tokens are a single source of truth
- (+) Zero CSS bundle overhead (Tailwind purges unused styles)
- (-) Inline templates with many utility classes can be verbose
- (-) CSS custom properties for dark mode require consistent `dark:` prefix usage

---

## ADR-7: JWT Auth with localStorage

**Context:** The app needs persistent authentication across page refreshes. Options: localStorage (simple), httpOnly cookies (secure), sessionStorage (session-only).

**Decision:** Store JWT in localStorage. Token is loaded into a signal on app initialization. Auth guard checks the signal synchronously.

**Consequences:**
- (+) Simple implementation — no cookie configuration needed
- (+) Works with the Angular HttpClient interceptor pattern
- (-) Vulnerable to XSS (mitigated by input sanitization and CSP)
- (-) Token cannot be revoked server-side (mitigated by short expiry + refresh)
