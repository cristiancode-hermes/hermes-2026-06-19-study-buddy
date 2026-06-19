import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';
import { StudyReview } from './study-review.entity';
import { Flashcard } from '../flashcards/flashcard.entity';
import { Deck } from '../decks/deck.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudyReview, Flashcard, Deck])],
  controllers: [StudyController],
  providers: [StudyService],
  exports: [StudyService],
})
export class StudyModule {}
