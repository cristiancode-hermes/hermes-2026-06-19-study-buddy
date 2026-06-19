import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../modules/users/user.entity';
import { Deck } from '../modules/decks/deck.entity';
import { Flashcard } from '../modules/flashcards/flashcard.entity';
import { StudyReview } from '../modules/study/study-review.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_URL || './data/study-buddy.db',
      entities: [User, Deck, Flashcard, StudyReview],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Deck, Flashcard, StudyReview]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
