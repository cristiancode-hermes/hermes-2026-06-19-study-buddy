import { Test, TestingModule } from '@nestjs/testing';
import { LocalFallbackStrategy } from './local-fallback.strategy';

describe('LocalFallbackStrategy', () => {
  let strategy: LocalFallbackStrategy;

  beforeEach(async () => {
    strategy = new LocalFallbackStrategy();
  });

  describe('generateFlashcards', () => {
    it('should return an array of flashcards from paragraph text', async () => {
      const text =
        'JavaScript is a programming language. It is used for web development.\n\nClosures are an important concept. They allow functions to access outer scope.';
      const cards = await strategy.generateFlashcards(text);
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((card) => {
        expect(card).toHaveProperty('front');
        expect(card).toHaveProperty('back');
        expect(typeof card.front).toBe('string');
        expect(typeof card.back).toBe('string');
      });
    });

    it('should handle empty text gracefully', async () => {
      const cards = await strategy.generateFlashcards('');
      expect(Array.isArray(cards)).toBe(true);
    });

    it('should handle single paragraph with no clear sentences', async () => {
      const text = 'JustSomeTextWithoutPunctuationOrSpaces';
      const cards = await strategy.generateFlashcards(text);
      expect(Array.isArray(cards)).toBe(true);
    });

    it('should return at most 20 cards', async () => {
      // Generate a long text that would produce many cards
      const paragraphs = Array.from(
        { length: 30 },
        (_, i) =>
          `This is paragraph ${i + 1}. It contains multiple sentences. Each sentence is meaningful.`,
      );
      const text = paragraphs.join('\n\n');
      const cards = await strategy.generateFlashcards(text);
      expect(cards.length).toBeLessThanOrEqual(20);
    });
  });

  describe('generateQuizQuestions', () => {
    it('should return quiz questions based on flashcards', async () => {
      const flashcards = [
        { front: 'What is JavaScript?', back: 'A programming language' },
        {
          front: 'What is a closure?',
          back: 'A function with access to outer scope',
        },
        { front: 'What is hoisting?', back: 'Moving declarations to the top' },
        { front: 'What is a Promise?', back: 'Async operation handler' },
      ];

      const questions = await strategy.generateQuizQuestions(flashcards, 2);
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBe(2);
      questions.forEach((q) => {
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('options');
        expect(q).toHaveProperty('correctAnswer');
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBe(4);
      });
    });

    it('should return fewer questions if not enough flashcards', async () => {
      const flashcards = [
        { front: 'What is JavaScript?', back: 'A programming language' },
      ];

      const questions = await strategy.generateQuizQuestions(flashcards, 5);
      expect(questions.length).toBe(1);
    });

    it('should make the correct answer one of the options', async () => {
      const flashcards = [
        { front: 'What is TypeScript?', back: 'Typed JavaScript' },
        { front: 'What is Node.js?', back: 'JavaScript runtime' },
        { front: 'What is React?', back: 'UI library' },
        { front: 'What is Angular?', back: 'Frontend framework' },
      ];

      const questions = await strategy.generateQuizQuestions(flashcards, 1);
      expect(questions[0].options).toContain(questions[0].correctAnswer);
    });
  });
});
