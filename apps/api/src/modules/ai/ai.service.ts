import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIStrategy } from './strategies/ai-strategy.interface';
import { OpenAIStrategy } from './strategies/openai.strategy';
import { LocalFallbackStrategy } from './strategies/local-fallback.strategy';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private strategy: AIStrategy;

  constructor(
    private readonly configService: ConfigService,
    private readonly openAIStrategy: OpenAIStrategy,
    private readonly localFallbackStrategy: LocalFallbackStrategy,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.strategy = apiKey ? openAIStrategy : localFallbackStrategy;
    this.logger.log(
      `Using ${apiKey ? 'OpenAI' : 'Local Fallback'} strategy for AI features`,
    );
  }

  async generateFlashcards(text: string): Promise<{ front: string; back: string }[]> {
    return this.strategy.generateFlashcards(text);
  }

  async generateQuizQuestions(
    flashcards: { front: string; back: string }[],
    count: number,
  ): Promise<{ question: string; options: string[]; correctAnswer: string }[]> {
    return this.strategy.generateQuizQuestions(flashcards, count);
  }
}
