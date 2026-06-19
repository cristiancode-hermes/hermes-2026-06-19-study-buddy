# Database Schema — Study Buddy

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Deck : owns
    Deck ||--o{ Flashcard : contains
    Flashcard ||--o{ StudyReview : has

    User {
        int id PK
        string email UK
        string passwordHash
        string name "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Deck {
        int id PK
        int userId FK
        string name
        text description "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Flashcard {
        int id PK
        int deckId FK
        text front "question"
        text back "answer"
        int position "ordering"
        datetime createdAt
        datetime updatedAt
    }

    StudyReview {
        int id PK
        int flashcardId FK
        int userId
        int quality "0|3|5"
        real easeFactor "min 1.3"
        int interval "days"
        int repetitions "count"
        date nextReview "YYYY-MM-DD"
        datetime reviewedAt
    }
```

## Migration Strategy

### Current (SQLite)
- TypeORM `synchronize: true` for rapid development
- Database file: `./data/study-buddy.db`

### Production (Neon PostgreSQL)
- Use TypeORM migrations: `typeorm migration:create`
- Enable pgvector extension if using embeddings
- Switch connection in `.env`:
  ```
  DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/study-buddy
  ```
- TypeORM config becomes:
  ```typescript
  TypeOrmModule.forRootAsync({
    useFactory: (config: ConfigService) => ({
      type: 'postgres',
      url: config.get<string>('DATABASE_URL'),
      entities: [__dirname + '/**/*.entity.{ts,js}'],
      synchronize: false,  // use migrations in prod
      ssl: { rejectUnauthorized: false },
    }),
  })
  ```

## Questions SQL Clave

### 1. Flashcards debidas para repaso
```sql
-- Cards due today or never studied
SELECT f.* FROM flashcards f
LEFT JOIN (
  SELECT flashcardId, MAX(reviewedAt) as maxReviewed
  FROM study_reviews WHERE userId = ?
  GROUP BY flashcardId
) latest ON latest.flashcardId = f.id
LEFT JOIN study_reviews sr
  ON sr.flashcardId = latest.flashcardId
  AND sr.reviewedAt = latest.maxReviewed
WHERE f.deckId = ?
  AND (sr.nextReview IS NULL OR sr.nextReview <= CURRENT_DATE)
ORDER BY sr.nextReview ASC NULLS FIRST, f.position ASC
```

### 2. Estadísticas de estudio
```sql
SELECT
  COUNT(*) as totalReviewed,
  SUM(CASE WHEN quality >= 3 THEN 1 ELSE 0 END) as correct,
  SUM(CASE WHEN quality < 3 THEN 1 ELSE 0 END) as incorrect,
  ROUND(AVG(CASE WHEN quality >= 3 THEN 1.0 ELSE 0 END) * 100, 1) as accuracy
FROM study_reviews
WHERE userId = ? AND reviewedAt >= ? AND reviewedAt < ?
```

### 3. Racha actual (streak)
```sql
SELECT DATE(reviewedAt) as studyDate, COUNT(*) as count
FROM study_reviews
WHERE userId = ?
GROUP BY DATE(reviewedAt)
ORDER BY studyDate DESC
```

## Neon Compatibility

| Concept | SQLite | PostgreSQL | TypeORM |
|---------|--------|-----------|---------|
| Integer | `integer` | `integer` | `@Column({ type: 'int' })` |
| Float | `real` | `real` | `@Column({ type: 'real' })` |
| Text | `text` | `text` | `@Column({ type: 'text' })` |
| Date | `date` (ISO) | `date` | `@Column({ type: 'date' })` |
| Timestamp | `datetime` | `timestamp` | `@CreateDateColumn()` |
| Current Date | `CURRENT_DATE` | `CURRENT_DATE` | Compatible |
| Date Extract | `strftime()` | `EXTRACT()` | Use env-aware QueryBuilder |
