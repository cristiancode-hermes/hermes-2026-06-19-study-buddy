import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAIStrategy } from './strategies/openai.strategy';
import { LocalFallbackStrategy } from './strategies/local-fallback.strategy';

@Module({
  controllers: [AiController],
  providers: [AiService, OpenAIStrategy, LocalFallbackStrategy],
  exports: [AiService],
})
export class AiModule {}
