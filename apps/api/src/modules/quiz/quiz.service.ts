import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flashcard } from '../flashcards/flashcard.entity';
import { Deck } from '../decks/deck.entity';
import { StudyReview } from '../study/study-review.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Flashcard)
    private readonly flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(Deck)
    private readonly decksRepository: Repository<Deck>,
    @InjectRepository(StudyReview)
    private readonly studyReviewsRepository: Repository<StudyReview>,
    private readonly aiService: AiService,
  ) {}

  async generateQuiz(deckId: number, userId: number, count: number = 10) {
    const deck = await this.decksRepository.findOne({ where: { id: deckId } });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const flashcards = await this.flashcardsRepository.find({
      where: { deckId },
      order: { position: 'ASC' },
    });

    if (flashcards.length === 0) {
      return [];
    }

    const cards = flashcards.map((f) => ({
      front: f.front,
      back: f.back,
    }));

    return this.aiService.generateQuizQuestions(cards, count);
  }

  async submitResult(
    deckId: number,
    userId: number,
    results: { flashcardId: number; correct: boolean }[],
  ) {
    const deck = await this.decksRepository.findOne({ where: { id: deckId } });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, incorrect: total - correct, score };
  }
}
