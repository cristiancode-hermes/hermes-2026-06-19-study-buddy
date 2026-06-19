import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecksController } from './decks.controller';
import { DecksService } from './decks.service';
import { Deck } from './deck.entity';
import { Flashcard } from '../flashcards/flashcard.entity';
import { StudyReview } from '../study/study-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deck, Flashcard, StudyReview])],
  controllers: [DecksController],
  providers: [DecksService],
  exports: [DecksService],
})
export class DecksModule {}
