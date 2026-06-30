import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deck } from '../decks/deck.entity';
import { Flashcard } from '../flashcards/flashcard.entity';
import { StudyReview } from '../study/study-review.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Deck)
    private readonly decksRepository: Repository<Deck>,
    @InjectRepository(Flashcard)
    private readonly flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(StudyReview)
    private readonly studyReviewsRepository: Repository<StudyReview>,
  ) {}

  async getDashboard(userId: number) {
    const totalDecks = await this.decksRepository.count({
      where: { userId },
    });

    const totalCards = await this.flashcardsRepository
      .createQueryBuilder('f')
      .innerJoin('f.deck', 'd')
      .where('d.userId = :userId', { userId })
      .getCount();

    const today = new Date().toISOString().split('T')[0];

    const dueToday = await this.flashcardsRepository
      .createQueryBuilder('f')
      .innerJoin('f.deck', 'd', 'd.userId = :userId', { userId })
      .innerJoin('f.reviews', 'r', 'r.userId = :userId')
      .where('r.nextReview <= :today', { today })
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
      .getCount();

    // Streak calculation
    const allReviews = await this.studyReviewsRepository.find({
      where: { userId },
      order: { reviewedAt: 'DESC' },
    });

    const reviewDates = [
      ...new Set(
        allReviews.map(
          (r) => new Date(r.reviewedAt).toISOString().split('T')[0],
        ),
      ),
    ].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const checkDate = new Date();

    for (const date of reviewDates) {
      const expected = checkDate.toISOString().split('T')[0];
      if (date === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Deck summaries
    const decks = await this.decksRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    const deckSummaries = await Promise.all(
      decks.map(async (deck) => {
        const cardCount = await this.flashcardsRepository.count({
          where: { deckId: deck.id },
        });

        const deckDueToday = await this.flashcardsRepository
          .createQueryBuilder('f')
          .innerJoin('f.reviews', 'r', 'r.userId = :userId', { userId })
          .where('f.deckId = :deckId', { deckId: deck.id })
          .andWhere('r.nextReview <= :today', { today })
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
          .getCount();

        return {
          id: deck.id,
          name: deck.name,
          cardCount,
          dueToday: deckDueToday,
        };
      }),
    );

    return {
      totalDecks,
      totalCards,
      dueToday,
      streak,
      decks: deckSummaries,
    };
  }
}
