import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DecksModule } from './modules/decks/decks.module';
import { FlashcardsModule } from './modules/flashcards/flashcards.module';
import { StudyModule } from './modules/study/study.module';
import { AiModule } from './modules/ai/ai.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.get<string>('DATABASE_URL', './data/study-buddy.db'),
        entities: [__dirname + '/**/*.entity.{ts,js}'],
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    DecksModule,
    FlashcardsModule,
    StudyModule,
    AiModule,
    QuizModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
