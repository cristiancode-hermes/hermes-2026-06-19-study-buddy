import { StudyService } from './study.service';
import { Repository } from 'typeorm';
import { StudyReview } from './study-review.entity';
import { Flashcard } from '../flashcards/flashcard.entity';
import { Deck } from '../decks/deck.entity';

describe('StudyService - SM-2 Algorithm', () => {
  let service: StudyService;
  let studyReviewRepo: Partial<Repository<StudyReview>>;
  let flashcardRepo: Partial<Repository<Flashcard>>;
  let deckRepo: Partial<Repository<Deck>>;

  beforeEach(() => {
    studyReviewRepo = {};
    flashcardRepo = {};
    deckRepo = {};

    service = new StudyService(
      studyReviewRepo as Repository<StudyReview>,
      flashcardRepo as Repository<Flashcard>,
      deckRepo as Repository<Deck>,
    );
  });

  describe('computeSM2 (private method - accessed via rateCard)', () => {
    // We test the SM-2 logic through the rateCard method
    // by mocking the dependencies appropriately

    it('should set interval=1 and repetitions=0 for quality < 3 (difficult)', () => {
      // Access private method via bracket notation for testing
      const result = (service as any).computeSM2(10, 5, 2.5, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should set interval=1 for first correct answer (quality >= 3)', () => {
      const result = (service as any).computeSM2(0, 0, 2.5, 4);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('should set interval=6 for second correct answer', () => {
      const result = (service as any).computeSM2(1, 1, 2.5, 4);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('should multiply interval by easeFactor for subsequent correct answers', () => {
      const result = (service as any).computeSM2(6, 2, 2.5, 4);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
      expect(result.repetitions).toBe(3);
    });

    it('should clamp easeFactor to minimum 1.3', () => {
      const result = (service as any).computeSM2(1, 0, 1.3, 0);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should increase easeFactor for high quality reviews', () => {
      const result = (service as any).computeSM2(1, 0, 2.5, 5);
      // EF' = 2.5 + (0.1 - (5-5)*(0.08 + (5-5)*0.02)) = 2.5 + 0.1 = 2.6
      expect(result.easeFactor).toBeCloseTo(2.6, 1);
    });

    it('should decrease easeFactor for low quality reviews', () => {
      const result = (service as any).computeSM2(1, 0, 2.5, 3);
      // EF' = 2.5 + (0.1 - (2)*(0.08 + 2*0.02)) = 2.5 + (0.1 - 2*0.12) = 2.5 + (0.1 - 0.24) = 2.36
      expect(result.easeFactor).toBeCloseTo(2.36, 1);
    });

    it('should handle quality=5 (perfect) correctly', () => {
      const result = (service as any).computeSM2(0, 0, 2.5, 5);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      expect(result.easeFactor).toBeCloseTo(2.6, 1);
    });

    it('should handle quality=0 (complete blackout) correctly', () => {
      const result = (service as any).computeSM2(10, 5, 2.5, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
      // EF' = 2.5 + (0.1 - 5*0.18) = 2.5 + (0.1 - 0.9) = 1.7
      expect(result.easeFactor).toBeCloseTo(1.7, 1);
    });
  });
});
