import { DashboardService } from './dashboard.service';
import { Repository } from 'typeorm';
import { Deck } from '../decks/deck.entity';
import { Flashcard } from '../flashcards/flashcard.entity';
import { StudyReview } from '../study/study-review.entity';

/**
 * Build a chainable query builder mock for TypeORM's createQueryBuilder pattern.
 * Each method returns the builder itself so calls can be chained.
 * A `getCount` mock is always provided; additional terminal methods like
 * `getMany` can be set via `overrides`.
 */
function createQueryBuilderMock(overrides: {
  getCount?: jest.Mock;
  getMany?: jest.Mock;
} = {}) {
  const getCount = overrides.getCount ?? jest.fn().mockResolvedValue(0);
  const getMany = overrides.getMany ?? jest.fn().mockResolvedValue([]);

  const qb: any = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount,
    getMany,
    subQuery: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('(SELECT sr.id FROM study_reviews sr WHERE sr.flashcardId = f.id AND sr.userId = :userId ORDER BY sr.id DESC LIMIT 1)'),
  };

  return qb;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let decksRepo: jest.Mocked<Partial<Repository<Deck>>>;
  let flashcardsRepo: jest.Mocked<Partial<Repository<Flashcard>>>;
  let studyReviewsRepo: jest.Mocked<Partial<Repository<StudyReview>>>;

  const mockDecks = [
    { id: 1, userId: 1, name: 'Deck 1', description: 'desc', updatedAt: new Date('2026-06-18') } as Deck,
    { id: 2, userId: 1, name: 'Deck 2', description: 'desc', updatedAt: new Date('2026-06-17') } as Deck,
  ];

  beforeEach(() => {
    decksRepo = {
      count: jest.fn(),
      find: jest.fn(),
    } as jest.Mocked<Partial<Repository<Deck>>>;

    flashcardsRepo = {
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<Partial<Repository<Flashcard>>>;

    studyReviewsRepo = {
      find: jest.fn(),
    } as jest.Mocked<Partial<Repository<StudyReview>>>;

    service = new DashboardService(
      decksRepo as Repository<Deck>,
      flashcardsRepo as Repository<Flashcard>,
      studyReviewsRepo as Repository<StudyReview>,
    );
  });

  describe('getDashboard', () => {
    it('should return dashboard with all metrics for a user with decks and reviews', async () => {
      // totalDecks
      decksRepo.count!.mockResolvedValue(2);
      // totalCards via query builder
      const totalCardsQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(10),
      });
      // dueToday via query builder
      const dueTodayQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(3),
      });
      // streak - all reviews
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      studyReviewsRepo.find!.mockResolvedValue([
        { id: 1, userId: 1, flashcardId: 1, reviewedAt: now } as StudyReview,
        { id: 2, userId: 1, flashcardId: 2, reviewedAt: now } as StudyReview,
        { id: 3, userId: 1, flashcardId: 3, reviewedAt: yesterday } as StudyReview,
        { id: 4, userId: 1, flashcardId: 4, reviewedAt: twoDaysAgo } as StudyReview,
      ]);

      // decks list
      decksRepo.find!.mockResolvedValue(mockDecks);
      // per-deck card counts
      flashcardsRepo.count!.mockResolvedValueOnce(5).mockResolvedValueOnce(3);
      // per-deck due counts
      const deckDueQb1 = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(2),
      });
      const deckDueQb2 = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(1),
      });

      // Wire up createQueryBuilder calls in order:
      // 1. totalCards -> qb
      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(totalCardsQb)
        // 2. dueToday -> qb
        .mockReturnValueOnce(dueTodayQb)
        // 3. deck 1 due -> qb
        .mockReturnValueOnce(deckDueQb1)
        // 4. deck 2 due -> qb
        .mockReturnValueOnce(deckDueQb2);

      const result = await service.getDashboard(1);

      expect(result.totalDecks).toBe(2);
      expect(result.totalCards).toBe(10);
      expect(result.dueToday).toBe(3);
      expect(result.streak).toBe(3); // today, yesterday, twoDaysAgo = 3 consecutive
      expect(result.decks).toHaveLength(2);
      expect(result.decks[0]).toEqual({
        id: 1,
        name: 'Deck 1',
        cardCount: 5,
        dueToday: 2,
      });
      expect(result.decks[1]).toEqual({
        id: 2,
        name: 'Deck 2',
        cardCount: 3,
        dueToday: 1,
      });

      // Verify key interactions
      expect(decksRepo.count).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(flashcardsRepo.createQueryBuilder).toHaveBeenCalledTimes(4);
      expect(flashcardsRepo.count).toHaveBeenCalledTimes(2);
      expect(flashcardsRepo.count).toHaveBeenCalledWith({
        where: { deckId: 1 },
      });
      expect(flashcardsRepo.count).toHaveBeenCalledWith({
        where: { deckId: 2 },
      });
      expect(decksRepo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { updatedAt: 'DESC' },
        take: 5,
      });
    });

    it('should return empty decks array when user has no decks', async () => {
      decksRepo.count!.mockResolvedValue(0);
      decksRepo.find!.mockResolvedValue([]);

      const totalCardsQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });
      const dueTodayQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });

      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(totalCardsQb)
        .mockReturnValueOnce(dueTodayQb);

      studyReviewsRepo.find!.mockResolvedValue([]);

      const result = await service.getDashboard(1);

      expect(result).toEqual({
        totalDecks: 0,
        totalCards: 0,
        dueToday: 0,
        streak: 0,
        decks: [],
      });
      expect(flashcardsRepo.count).not.toHaveBeenCalled();
    });

    it('should return streak 0 when user has no reviews', async () => {
      decksRepo.count!.mockResolvedValue(1);
      decksRepo.find!.mockResolvedValue(mockDecks.slice(0, 1));

      const totalCardsQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(5),
      });
      const dueTodayQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });
      const deckDueQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });

      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(totalCardsQb)
        .mockReturnValueOnce(dueTodayQb)
        .mockReturnValueOnce(deckDueQb);

      flashcardsRepo.count!.mockResolvedValue(5);
      studyReviewsRepo.find!.mockResolvedValue([]);

      const result = await service.getDashboard(1);

      expect(result.streak).toBe(0);
    });

    it('should count streak correctly with gap (broken streak)', async () => {
      decksRepo.count!.mockResolvedValue(0);
      decksRepo.find!.mockResolvedValue([]);

      const totalCardsQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });
      const dueTodayQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });

      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(totalCardsQb)
        .mockReturnValueOnce(dueTodayQb);

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      studyReviewsRepo.find!.mockResolvedValue([
        { id: 1, userId: 1, flashcardId: 1, reviewedAt: now } as StudyReview,
        { id: 2, userId: 1, flashcardId: 2, reviewedAt: twoDaysAgo } as StudyReview,
      ]);

      const result = await service.getDashboard(1);

      // Only today counts; yesterday is missing so streak breaks at 1
      expect(result.streak).toBe(1);
    });

    it('should handle multiple reviews on the same date (deduplicated streak)', async () => {
      decksRepo.count!.mockResolvedValue(0);
      decksRepo.find!.mockResolvedValue([]);

      const totalCardsQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });
      const dueTodayQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });

      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(totalCardsQb)
        .mockReturnValueOnce(dueTodayQb);

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      studyReviewsRepo.find!.mockResolvedValue([
        { id: 1, userId: 1, flashcardId: 1, reviewedAt: now } as StudyReview,
        { id: 2, userId: 1, flashcardId: 2, reviewedAt: now } as StudyReview,
        { id: 3, userId: 1, flashcardId: 3, reviewedAt: yesterday } as StudyReview,
        { id: 4, userId: 1, flashcardId: 4, reviewedAt: yesterday } as StudyReview,
      ]);

      const result = await service.getDashboard(1);

      // 2 unique dates (today, yesterday) = streak 2, not 4
      expect(result.streak).toBe(2);
    });

    it('should handle a long streak of 5+ consecutive days', async () => {
      decksRepo.count!.mockResolvedValue(0);
      decksRepo.find!.mockResolvedValue([]);

      const totalCardsQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });
      const dueTodayQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });

      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(totalCardsQb)
        .mockReturnValueOnce(dueTodayQb);

      const now = new Date();
      const reviews: StudyReview[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        reviews.push({ id: i + 1, userId: 1, flashcardId: i + 1, reviewedAt: d } as StudyReview);
      }
      studyReviewsRepo.find!.mockResolvedValue(reviews);

      const result = await service.getDashboard(1);

      expect(result.streak).toBe(7);
    });

    it('should limit decks to top 5 by updatedAt', async () => {
      const manyDecks = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        userId: 1,
        name: `Deck ${i + 1}`,
        description: 'desc',
        updatedAt: new Date(2026, 5, 20 - i),
      })) as Deck[];

      decksRepo.count!.mockResolvedValue(10);
      decksRepo.find!.mockResolvedValue(manyDecks.slice(0, 5));

      const totalCardsQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(20),
      });
      const dueTodayQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(5),
      });

      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(totalCardsQb)
        .mockReturnValueOnce(dueTodayQb);

      // Each of the 5 decks needs a due count qb
      for (let i = 0; i < 5; i++) {
        flashcardsRepo.createQueryBuilder!
          .mockReturnValueOnce(
            createQueryBuilderMock({
              getCount: jest.fn().mockResolvedValue(i),
            }),
          );
      }

      flashcardsRepo.count!.mockResolvedValue(3); // same card count for all decks via mockResolvedValue

      studyReviewsRepo.find!.mockResolvedValue([
        { id: 1, userId: 1, flashcardId: 1, reviewedAt: new Date() } as StudyReview,
      ]);

      const result = await service.getDashboard(1);

      expect(result.totalDecks).toBe(10);
      expect(result.decks).toHaveLength(5);
      expect(decksRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('should query totalCards by joining decks on userId', async () => {
      decksRepo.count!.mockResolvedValue(0);
      decksRepo.find!.mockResolvedValue([]);

      const totalCardsQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });
      const dueTodayQb = createQueryBuilderMock({
        getCount: jest.fn().mockResolvedValue(0),
      });

      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(totalCardsQb)
        .mockReturnValueOnce(dueTodayQb);

      studyReviewsRepo.find!.mockResolvedValue([]);

      await service.getDashboard(1);

      expect(totalCardsQb.innerJoin).toHaveBeenCalledWith(
        'f.deck',
        'd',
      );
      expect(totalCardsQb.where).toHaveBeenCalledWith(
        'd.userId = :userId',
        { userId: 1 },
      );
    });
  });
});
