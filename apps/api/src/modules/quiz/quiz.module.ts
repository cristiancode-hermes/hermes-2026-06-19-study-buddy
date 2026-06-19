import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { Flashcard } from '../flashcards/flashcard.entity';
import { Deck } from '../decks/deck.entity';
import { StudyReview } from '../study/study-review.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard, Deck, StudyReview]), AiModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
