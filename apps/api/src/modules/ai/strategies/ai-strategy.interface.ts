export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface AIStrategy {
  generateFlashcards(text: string): Promise<{ front: string; back: string }[]>;
  generateQuizQuestions(
    flashcards: { front: string; back: string }[],
    count: number,
  ): Promise<QuizQuestion[]>;
}
