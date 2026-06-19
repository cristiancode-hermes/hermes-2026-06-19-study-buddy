import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';
import { Flashcard } from './flashcard.entity';
import { Deck } from '../decks/deck.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard, Deck])],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
