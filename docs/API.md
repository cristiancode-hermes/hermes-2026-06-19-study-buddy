# API Reference — Study Buddy

Base URL: `http://localhost:3000/api`

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}

Response 201:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response 201:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>

Response 200:
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "createdAt": "2026-06-19T01:00:00.000Z"
}
```

### Update Profile
```http
PATCH /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name"
}

Response 200:
{
  "id": 1,
  "email": "user@example.com",
  "name": "New Name"
}
```

## Decks

### List Decks
```http
GET /api/decks?search=javascript
Authorization: Bearer <token>

Response 200:
[
  {
    "id": 1,
    "name": "JavaScript Fundamentals",
    "description": "Core JavaScript concepts",
    "cardCount": 5,
    "dueCount": 3,
    "createdAt": "2026-06-19T01:00:00.000Z"
  }
]
```

### Get Deck
```http
GET /api/decks/1
Authorization: Bearer <token>

Response 200:
{
  "id": 1,
  "name": "JavaScript Fundamentals",
  "description": "Core JavaScript concepts",
  "cardCount": 5,
  "dueCount": 3,
  "createdAt": "2026-06-19T01:00:00.000Z"
}
```

### Create Deck
```http
POST /api/decks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Deck",
  "description": "Optional description"
}

Response 201:
{
  "id": 4,
  "name": "New Deck",
  "description": "Optional description",
  "cardCount": 0,
  "dueCount": 0,
  "createdAt": "2026-06-19T01:00:00.000Z"
}
```

### Update Deck
```http
PATCH /api/decks/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name"
}

Response 200: { ... }
```

### Delete Deck
```http
DELETE /api/decks/1
Authorization: Bearer <token>

Response 200: { "message": "Deck deleted successfully" }
```

## Flashcards

### List Flashcards for a Deck
```http
GET /api/decks/1/flashcards
Authorization: Bearer <token>

Response 200:
[
  {
    "id": 1,
    "deckId": 1,
    "front": "What is closure in JavaScript?",
    "back": "A function that has access to its outer function scope...",
    "position": 0,
    "difficulty": "medium",
    "createdAt": "2026-06-19T01:00:00.000Z"
  }
]
```

### Create Flashcard
```http
POST /api/decks/1/flashcards
Authorization: Bearer <token>
Content-Type: application/json

{
  "front": "What is a Promise?",
  "back": "An object representing the eventual completion of an async operation"
}

Response 201: { ... }
```

### Update Flashcard
```http
PATCH /api/flashcards/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "front": "Updated question"
}

Response 200: { ... }
```

### Delete Flashcard
```http
DELETE /api/flashcards/1
Authorization: Bearer <token>

Response 200: { "message": "Flashcard deleted successfully" }
```

### Batch Create
```http
POST /api/decks/1/flashcards/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "cards": [
    { "front": "Question 1", "back": "Answer 1" },
    { "front": "Question 2", "back": "Answer 2" }
  ]
}

Response 201:
{
  "saved": 2,
  "cards": [ ... ]
}
```

## Study (SM-2 Spaced Repetition)

### Get Due Cards
```http
GET /api/study/1/due
Authorization: Bearer <token>

Response 200:
[
  {
    "id": 3,
    "deckId": 1,
    "front": "What is hoisting?",
    "back": "JavaScript behavior...",
    "position": 2,
    "easeFactor": 2.5,
    "interval": 1,
    "repetitions": 0,
    "nextReview": "2026-06-19"
  }
]
```

### Rate a Card
```http
POST /api/study/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "flashcardId": 3,
  "quality": 5
}

Response 201:
{
  "nextReview": "2026-06-25",
  "interval": 6,
  "easeFactor": 2.6,
  "repetitions": 1
}
```

Quality values: 0 = Difícil, 3 = Media, 5 = Fácil

### Get Study Stats
```http
GET /api/study/stats
Authorization: Bearer <token>

Response 200:
{
  "totalReviewed": 10,
  "correct": 7,
  "incorrect": 3,
  "streak": 2,
  "accuracy": 70
}
```

## AI Flashcard Generation

### Generate Flashcards
```http
POST /api/ai/generate-flashcards
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "JavaScript is a programming language... Closures are an important concept...",
  "deckId": 1
}

Response 201:
{
  "cards": [
    { "front": "What is JavaScript?", "back": "A programming language" },
    { "front": "What is a closure?", "back": "A function with access to outer scope" }
  ]
}
```

## Quiz

### Generate Quiz
```http
GET /api/quiz/1/generate?count=5
Authorization: Bearer <token>

Response 200:
{
  "questions": [
    {
      "question": "What is closure in JavaScript?",
      "options": [
        "A function with access to outer scope",
        "A data structure",
        "A built-in method",
        "A CSS property"
      ],
      "correctAnswer": "A function with access to outer scope"
    }
  ]
}
```

### Submit Quiz Result
```http
POST /api/quiz/1/result
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 4,
  "total": 5,
  "wrongIds": [2]
}

Response 201:
{
  "message": "Quiz result saved",
  "streak": 3,
  "accuracy": 80
}
```

## Dashboard

### Get Dashboard Data
```http
GET /api/dashboard
Authorization: Bearer <token>

Response 200:
{
  "totalDecks": 3,
  "totalCards": 15,
  "dueToday": 5,
  "streak": 2,
  "decks": [
    {
      "id": 1,
      "name": "JavaScript Fundamentals",
      "cardCount": 5,
      "dueCount": 3
    }
  ]
}
```
