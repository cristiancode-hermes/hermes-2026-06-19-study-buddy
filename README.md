# Study Buddy — AI-Powered Flashcard & Quiz Platform

Aprende cualquier tema con flashcards inteligentes generadas por IA, repaso espaciado (SM-2) y quizzes adaptativos.

## Features

- **JWT Authentication** — Register and login with email/password
- **Deck Management** — Create, edit, delete decks with search and filter
- **Flashcard CRUD** — Create, edit, delete flashcards with difficulty badges
- **Spaced Repetition (SM-2)** — Study mode with 3D flip animation and adaptive review intervals
- **AI Flashcard Generation** — Paste text and generate flashcards via OpenAI API (with local fallback)
- **Quiz Mode** — Multiple-choice quizzes generated from your flashcards
- **Dashboard** — Stats for decks, cards due today, study streak
- **Dark Mode** — Persistent dark/light theme toggle
- **Lazy Loading** — Angular 22 signal-first architecture with 10 separate chunks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 22 + Signals + Zoneless + Tailwind CSS v4 |
| Backend | NestJS + TypeORM + better-sqlite3 |
| Database | SQLite (dev) / Neon PostgreSQL (prod) — PostgreSQL-compatible schema |
| AI | OpenAI-compatible LLM via Strategy Pattern with local fallback |
| Auth | JWT with Passport.js + bcryptjs |
| API Docs | Swagger at `/api/docs` |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Angular 22    │────▶│   NestJS API    │────▶│   SQLite DB  │
│  (Signals/SSR)  │◀────│  (REST/Swagger) │◀────│ (better-sql) │
└─────────────────┘     └─────────────────┘     └──────────────┘
         │                       │
         │                  ┌────┴────┐
         │                  │ OpenAI  │
         │                  │  API    │
         │                  └─────────┘
         │
    [Lazy chunks: 10]
```

## Prerequisites

- Node.js 22+
- npm 10+

## Local Setup

### 1. Clone and install

```bash
cd apps/api
npm install
cp .env.example .env

cd ../web
npm install
```

### 2. Configure environment

Edit `apps/api/.env`:

```env
DATABASE_URL=./data/study-buddy.db
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=sk-...  # Optional — uses local fallback if empty
```

### 3. Seed the database

```bash
cd apps/api
npm run seed
```

This creates:
- 2 demo users (`test@test.com` / `password123`, `student@test.com` / `password123`)
- 3 decks with 15 flashcards
- Sample study reviews demonstrating SM-2 algorithm

### 4. Run the API

```bash
cd apps/api
npm run start:dev
```

API available at http://localhost:3000
Swagger docs at http://localhost:3000/api/docs

### 5. Run the frontend

```bash
cd apps/web
npm run start
```

Frontend available at http://localhost:4200

### 6. Build for production

```bash
# API
cd apps/api && npm run build

# Frontend
cd apps/web && npm run build
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/profile` | Get profile | JWT |
| GET/POST/PATCH/DELETE | `/api/decks` | Deck CRUD | JWT |
| GET/POST | `/api/decks/:id/flashcards` | Flashcard CRUD | JWT |
| GET | `/api/study/:deckId/due` | Due cards for review | JWT |
| POST | `/api/study/rate` | Rate a flashcard (SM-2) | JWT |
| POST | `/api/ai/generate-flashcards` | AI generate flashcards | JWT |
| GET | `/api/quiz/:deckId/generate` | Generate quiz | JWT |
| GET | `/api/dashboard` | Dashboard stats | JWT |

## Testing

```bash
cd apps/api
npm test
```

17 tests across 3 suites (SM-2 algorithm + AI fallback strategy + app controller).

## License

MIT
