import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyReview } from './study-review.entity';
import { Flashcard } from '../flashcards/flashcard.entity';
import { Deck } from '../decks/deck.entity';
import { RateCardDto } from './dto/rate-card.dto';

@Injectable()
export class StudyService {
  constructor(
    @InjectRepository(StudyReview)
    private readonly studyReviewsRepository: Repository<StudyReview>,
    @InjectRepository(Flashcard)
    private readonly flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(Deck)
    private readonly decksRepository: Repository<Deck>,
  ) {}

  async getDueCards(deckId: number, userId: number) {
    const deck = await this.decksRepository.findOne({ where: { id: deckId } });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const today = new Date().toISOString().split('T')[0];

    // Cards that have a review due today or earlier
    const dueCards = await this.flashcardsRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.reviews', 'r', 'r.userId = :userId', { userId })
      .where('f.deckId = :deckId', { deckId })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('sr.id')
          .from(StudyReview, 'sr')
          .where('sr.flashcardId = f.id')
          .andWhere('sr.userId = :userId')
          .orderBy('sr.id', 'DESC')
          .limit(1)
          .getQuery();
        return 'r.id = ' + subQuery;
      })
      .andWhere('r.nextReview <= :today', { today })
      .orderBy('r.nextReview', 'ASC')
      .getMany();

    // Cards that have never been reviewed
    const newCards = await this.flashcardsRepository
      .createQueryBuilder('f')
      .leftJoin('f.reviews', 'r', 'r.userId = :userId', { userId })
      .where('f.deckId = :deckId', { deckId })
      .andWhere('r.id IS NULL')
      .orderBy('f.position', 'ASC')
      .getMany();

    return [...newCards, ...dueCards];
  }

  async rateCard(dto: RateCardDto, userId: number) {
    const flashcard = await this.flashcardsRepository.findOne({
      where: { id: dto.flashcardId },
      relations: { deck: true },
    });

    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }
    if (flashcard.deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Get the latest review for this card
    const lastReview = await this.studyReviewsRepository.findOne({
      where: { flashcardId: dto.flashcardId, userId },
      order: { id: 'DESC' },
    });

    // SM-2 Algorithm
    const { interval, repetitions, easeFactor } = this.computeSM2(
      lastReview?.interval ?? 0,
      lastReview?.repetitions ?? 0,
      lastReview?.easeFactor ?? 2.5,
      dto.quality,
    );

    const today = new Date();
    const nextReviewDate = new Date(today);
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    const nextReview = nextReviewDate.toISOString().split('T')[0];

    const review = this.studyReviewsRepository.create({
      flashcardId: dto.flashcardId,
      userId,
      quality: dto.quality,
      easeFactor,
      interval,
      repetitions,
      nextReview,
    });

    await this.studyReviewsRepository.save(review);

    return {
      nextReview,
      interval,
      easeFactor,
      repetitions,
    };
  }

  async getStats(userId: number) {
    const allReviews = await this.studyReviewsRepository.find({
      where: { userId },
    });

    const totalReviewed = allReviews.length;
    const correct = allReviews.filter((r) => r.quality >= 3).length;
    const incorrect = totalReviewed - correct;

    // Calculate streak (consecutive days with at least one review)
    const reviewDates = [
      ...new Set(
        allReviews.map(
          (r) => new Date(r.reviewedAt).toISOString().split('T')[0],
        ),
      ),
    ].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const checkDate = new Date(today);

    for (const date of reviewDates) {
      const expected = checkDate.toISOString().split('T')[0];
      if (date === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalReviewed,
      correct,
      incorrect,
      streak,
      accuracy:
        totalReviewed > 0 ? Math.round((correct / totalReviewed) * 100) : 0,
    };
  }

  private computeSM2(
    prevInterval: number,
    prevRepetitions: number,
    prevEaseFactor: number,
    quality: number,
  ): { interval: number; repetitions: number; easeFactor: number } {
    let interval: number;
    let repetitions: number;
    let easeFactor: number;

    if (quality >= 3) {
      // Correct response
      if (prevRepetitions === 0) {
        interval = 1;
      } else if (prevRepetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(prevInterval * prevEaseFactor);
      }
      repetitions = prevRepetitions + 1;
    } else {
      // Incorrect response - reset
      interval = 1;
      repetitions = 0;
    }

    // Update ease factor
    easeFactor = Math.max(
      1.3,
      prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    return { interval, repetitions, easeFactor };
  }
}
