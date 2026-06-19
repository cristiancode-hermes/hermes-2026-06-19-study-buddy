# AI Integration — Study Buddy

## AI Ladder Rung: 1–2

This project implements AI Ladder **Rung 1** (single LLM call) with a path to **Rung 2** (structured/streaming responses):

1. **Flashcard generation** — `POST /api/ai/generate-flashcards` sends text to AI, returns structured Q&A pairs
2. **Quiz generation** — `POST /api/ai/generate-quiz` sends flashcards to AI, returns multiple-choice questions

## Strategy Pattern

### Interface

```typescript
export interface AIStrategy {
  generateFlashcards(text: string): Promise<{ front: string; back: string }[]>;
  generateQuizQuestions(
    flashcards: { front: string; back: string }[],
    count: number,
  ): Promise<QuizQuestion[]>;
}
```

### Implementation 1: OpenAI Strategy (`openai.strategy.ts`)

Uses OpenAI Chat Completions API via `axios`. Activated when `OPENAI_API_KEY` environment variable is set.

**Flashcard Generation Prompt:**
```
Extract key concepts from the following text and create question-answer pairs (flashcards).
Each flashcard should have a clear question (front) and concise answer (back).
Return as JSON array: { "cards": [{ "front": "...", "back": "..." }] }
Focus on factual information suitable for study.
```

**Quiz Generation Prompt:**
```
Create {count} multiple-choice questions from these flashcards.
Each question has 4 options with exactly 1 correct answer.
Return as JSON array: { "questions": [{ "question": "...", "options": ["..."], "correctAnswer": "..." }] }
```

### Implementation 2: Local Fallback Strategy (`local-fallback.strategy.ts`)

Rule-based extraction when no API key is available:

**Flashcard Generation:**
1. Split text by paragraphs (double newlines)
2. For each paragraph:
   - Find sentences with key terms (is, are, was, were, refers to, means)
   - Create Q&A: "What is [key term]?" / "[definition]"
   - If no key terms, split into two halves: front=first sentence, back=rest
3. Maximum 20 cards, deduplicated by front text
4. Minimum 3-character front/back

**Quiz Generation:**
1. For N requested questions, select N flashcards
2. For each flashcard:
   - Correct answer = flashcard.back
   - Distractors = other flashcards' back values (randomly selected)
   - Ensure 3 distractors + 1 correct = 4 options
3. Shuffle option order

## Configuration

Set in environment:
```env
OPENAI_API_KEY=sk-your-key-here    # Optional — uses local fallback if empty
```

The AI service detects whether the key is set and selects the appropriate strategy:

```typescript
@Injectable()
export class AiService {
  private strategy: AIStrategy;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('OPENAI_API_KEY');
    this.strategy = apiKey
      ? new OpenAIStrategy(apiKey)
      : new LocalFallbackStrategy();
  }
}
```

## Testing

Two test files covering the AI integration:

1. `local-fallback.strategy.spec.ts` — 8 tests: flashcard generation (empty, single, paragraph, max limit), quiz generation (basic, edge cases, option correctness)
2. `study.service.spec.ts` — 7 tests covering SM-2 algorithm (not strictly AI, but related to the study loop)

## Limitations & Future Improvements

| Limitation | Future Improvement |
|-----------|-------------------|
| Local fallback uses simple heuristics | Implement embeddings-based matching |
| OpenAI strategy uses synchronous generation | Add streaming response for real-time card preview |
| No prompt engineering optimization | Add prompt templates with few-shot examples |
| No rate limiting or cost tracking | Add usage quotas and token counting |
| No embedding/vector search (Rung 3) | Add pgvector on Neon for semantic search |
