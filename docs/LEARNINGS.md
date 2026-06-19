# Learnings — hermes-study-buddy (2026-06-19)

## What This Project Taught

### 1. Parallel Delegation with Timeout Handling
Subagents timed out at 600s but produced working code. The pattern of delegating backend+f-frontend in parallel works — both produced ~95% complete code before timeout. The key is: accept partial results from timed-out subagents and fix remaining issues yourself. Time is saved even with the fix-up phase.

### 2. SM-2 Spaced Repetition Algorithm Implementation
SM-2 is deceptively simple (~30 lines) but the devil is in the edge cases:
- First correct answer → interval = 1
- Second correct → interval = 6
- Subsequent → interval *= easeFactor
- Any incorrect → reset to interval = 1, repetitions = 0
- Ease factor formula: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
- Clamp ease factor to minimum 1.3

### 3. Angular 22 + Tailwind CSS v4 Theme Configuration
Tailwind CSS v4 uses a completely different configuration API than v3. Instead of `tailwind.config.js`, use `@theme` directive in CSS:
```css
@import "tailwindcss";
@theme {
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
}
```
The `@custom-variant dark` directive replaces `darkMode: 'class'`.

### 4. Strategy Pattern for AI Integration
The Strategy Pattern effectively decouples AI providers. The `AIStrategy` interface with `OpenAIStrategy` + `LocalFallbackStrategy` allows the app to work without any API key while being ready for production AI. The switch logic is simple: check env var at startup, select implementation.

### 5. Batch Endpoint Pattern for AI-Generated Content
The `/decks/:deckId/flashcards/batch` endpoint is essential for AI-generated flashcards. The user reviews and selects cards, then saves them all at once. Without a batch endpoint, each card would need a separate API call.

### 6. TypeORM 1.0 Testing Without Initialization
Unit testing services without a full NestJS test module works when the service only uses repository injection. Create partial mock repositories and pass them directly to the constructor:
```typescript
service = new StudyService(
  studyReviewRepo as Repository<StudyReview>,
  flashcardRepo as Repository<Flashcard>,
  deckRepo as Repository<Deck>,
);
```
This avoids the complexity of `Test.createTestingModule()` for pure logic tests.

### 7. Seed Script Pattern
A standalone seed module with its own TypeORM initialization (`NestFactory.createApplicationContext(SeedModule)`) is cleaner than inline seed logic in the app. It can be run independently and doesn't affect app startup time.

## Recurring Constraints (8th Consecutive Run)
- GITHUB_TOKEN remains empty — cannot push to GitHub
- NEON_API_KEY has invalid format (13 chars) — cannot use Neon
- OPENAI_API_KEY is empty — AI features use local fallback
- These are permanently accepted constraints at this point

## Improvements Over Tech Radar (2026-06-17)
1. **AI Build** — First counter=4 build with real AI Strategy Pattern (previous was non-AI)
2. **More entities** — 4 entities (User, Deck, Flashcard, StudyReview) with SM-2 algorithm
3. **More tests** — 17 tests (vs 12), including SM-2 algorithm coverage with edge cases
4. **AI Strategy Pattern** — First implementation of real LLM-ready AI architecture
5. **Better seed data** — 3 decks, 15 flashcards with study reviews demonstrating SM-2
6. **SM-2 algorithm** — Spaced repetition is more sophisticated than any previous project's logic
7. **3D flashcard flip animation** — First CSS 3D transform in a project
