import { QuizService } from './quiz.service';
import { Repository } from 'typeorm';
import { Flashcard } from '../flashcards/flashcard.entity';
import { Deck } from '../decks/deck.entity';
import { StudyReview } from '../study/study-review.entity';
import { AiService } from '../ai/ai.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('QuizService', () => {
  let service: QuizService;
  let flashcardsRepo: jest.Mocked<Partial<Repository<Flashcard>>>;
  let decksRepo: jest.Mocked<Partial<Repository<Deck>>>;
  let studyReviewsRepo: jest.Mocked<Partial<Repository<StudyReview>>>;
  let aiService: jest.Mocked<Partial<AiService>>;

  const mockDeck = { id: 1, userId: 1, name: 'Test Deck', description: 'desc' } as Deck;
  const mockFlashcards = [
    { id: 1, deckId: 1, front: 'Front 1', back: 'Back 1', position: 0 } as Flashcard,
    { id: 2, deckId: 1, front: 'Front 2', back: 'Back 2', position: 1 } as Flashcard,
  ];
  const mockQuizQuestions = [
    { question: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A' },
    { question: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B' },
  ];

  beforeEach(() => {
    flashcardsRepo = {
      find: jest.fn(),
    } as jest.Mocked<Partial<Repository<Flashcard>>>;

    decksRepo = {
      findOne: jest.fn(),
    } as jest.Mocked<Partial<Repository<Deck>>>;

    studyReviewsRepo = {} as jest.Mocked<Partial<Repository<StudyReview>>>;

    aiService = {
      generateQuizQuestions: jest.fn(),
    } as jest.Mocked<Partial<AiService>>;

    service = new QuizService(
      flashcardsRepo as Repository<Flashcard>,
      decksRepo as Repository<Deck>,
      studyReviewsRepo as Repository<StudyReview>,
      aiService as AiService,
    );
  });

  describe('generateQuiz', () => {
    it('should generate quiz questions for a valid deck', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);
      flashcardsRepo.find!.mockResolvedValue(mockFlashcards);
      aiService.generateQuizQuestions!.mockResolvedValue(mockQuizQuestions);

      const result = await service.generateQuiz(1, 1, 10);

      expect(decksRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(flashcardsRepo.find).toHaveBeenCalledWith({
        where: { deckId: 1 },
        order: { position: 'ASC' },
      });
      expect(aiService.generateQuizQuestions).toHaveBeenCalledWith(
        [
          { front: 'Front 1', back: 'Back 1' },
          { front: 'Front 2', back: 'Back 2' },
        ],
        10,
      );
      expect(result).toEqual(mockQuizQuestions);
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      decksRepo.findOne!.mockResolvedValue(null);

      await expect(service.generateQuiz(999, 1, 10)).rejects.toThrow(
        NotFoundException,
      );
      expect(flashcardsRepo.find).not.toHaveBeenCalled();
      expect(aiService.generateQuizQuestions).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own the deck', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      await expect(service.generateQuiz(1, 2, 10)).rejects.toThrow(
        ForbiddenException,
      );
      expect(flashcardsRepo.find).not.toHaveBeenCalled();
      expect(aiService.generateQuizQuestions).not.toHaveBeenCalled();
    });

    it('should return empty array when deck has no flashcards', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);
      flashcardsRepo.find!.mockResolvedValue([]);

      const result = await service.generateQuiz(1, 1, 10);

      expect(result).toEqual([]);
      expect(aiService.generateQuizQuestions).not.toHaveBeenCalled();
    });

    it('should use default count of 10 when count is omitted', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);
      flashcardsRepo.find!.mockResolvedValue(mockFlashcards);
      aiService.generateQuizQuestions!.mockResolvedValue(mockQuizQuestions);

      await service.generateQuiz(1, 1);

      expect(aiService.generateQuizQuestions).toHaveBeenCalledWith(
        expect.any(Array),
        10,
      );
    });

    it('should pass custom count to ai service', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);
      flashcardsRepo.find!.mockResolvedValue(mockFlashcards);
      aiService.generateQuizQuestions!.mockResolvedValue(mockQuizQuestions);

      await service.generateQuiz(1, 1, 5);

      expect(aiService.generateQuizQuestions).toHaveBeenCalledWith(
        expect.any(Array),
        5,
      );
    });

    it('should pass only front and back to ai service, not full entity', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);
      flashcardsRepo.find!.mockResolvedValue(mockFlashcards);
      aiService.generateQuizQuestions!.mockResolvedValue(mockQuizQuestions);

      await service.generateQuiz(1, 1, 10);

      const passedCards = (aiService.generateQuizQuestions as jest.Mock).mock
        .calls[0][0];
      expect(passedCards).toHaveLength(2);
      expect(passedCards[0]).toEqual({ front: 'Front 1', back: 'Back 1' });
      expect(passedCards[1]).toEqual({ front: 'Front 2', back: 'Back 2' });
      // Ensure no extra fields from entity leaked through
      expect(Object.keys(passedCards[0])).toEqual(['front', 'back']);
    });
  });

  describe('submitResult', () => {
    it('should calculate score when all answers are correct', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      const results = [
        { flashcardId: 1, correct: true },
        { flashcardId: 2, correct: true },
        { flashcardId: 3, correct: true },
      ];

      const result = await service.submitResult(1, 1, results);

      expect(result).toEqual({
        total: 3,
        correct: 3,
        incorrect: 0,
        score: 100,
      });
    });

    it('should calculate score when all answers are incorrect', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      const results = [
        { flashcardId: 1, correct: false },
        { flashcardId: 2, correct: false },
      ];

      const result = await service.submitResult(1, 1, results);

      expect(result).toEqual({
        total: 2,
        correct: 0,
        incorrect: 2,
        score: 0,
      });
    });

    it('should calculate partial score correctly', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      const results = [
        { flashcardId: 1, correct: true },
        { flashcardId: 2, correct: false },
        { flashcardId: 3, correct: true },
        { flashcardId: 4, correct: true },
      ];

      const result = await service.submitResult(1, 1, results);

      expect(result).toEqual({
        total: 4,
        correct: 3,
        incorrect: 1,
        score: 75,
      });
    });

    it('should return score 0 and 0/0 for empty results array', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      const result = await service.submitResult(1, 1, []);

      expect(result).toEqual({
        total: 0,
        correct: 0,
        incorrect: 0,
        score: 0,
      });
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      decksRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.submitResult(999, 1, [{ flashcardId: 1, correct: true }]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the deck', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      await expect(
        service.submitResult(1, 2, [{ flashcardId: 1, correct: true }]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should round score to nearest integer', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      // 1 out of 3 = 33.333... -> 33
      const result = await service.submitResult(1, 1, [
        { flashcardId: 1, correct: true },
        { flashcardId: 2, correct: false },
        { flashcardId: 3, correct: false },
      ]);

      expect(result.score).toBe(33);
    });

    it('should handle 1 correct out of 7 (14.2857 -> 14)', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      const results = Array.from({ length: 7 }, (_, i) => ({
        flashcardId: i + 1,
        correct: i === 0,
      }));

      const result = await service.submitResult(1, 1, results);

      expect(result).toEqual({
        total: 7,
        correct: 1,
        incorrect: 6,
        score: 14,
      });
    });
  });
});
