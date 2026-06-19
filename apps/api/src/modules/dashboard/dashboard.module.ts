import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Deck } from '../decks/deck.entity';
import { Flashcard } from '../flashcards/flashcard.entity';
import { StudyReview } from '../study/study-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deck, Flashcard, StudyReview])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
