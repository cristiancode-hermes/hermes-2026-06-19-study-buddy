export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface Deck {
  id: number;
  name: string;
  description?: string;
  cardCount: number;
  dueCount: number;
  createdAt: string;
}

export interface Flashcard {
  id: number;
  deckId: number;
  front: string;
  back: string;
  position: number;
  difficulty?: string;
}

export interface StudyCard extends Flashcard {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
}

export interface StudyReview {
  id: number;
  flashcardId: number;
  quality: number;
  easeFactor: number;
  interval: number;
  nextReview: string;
}

export interface DashboardStats {
  totalDecks: number;
  totalCards: number;
  dueToday: number;
  streak: number;
}

export interface GeneratedCard {
  front: string;
  back: string;
  selected: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface SessionStats {
  viewed: number;
  correct: number;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
