import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateFlashcardsDto } from './dto/generate-flashcards.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-flashcards')
  @ApiOperation({ summary: 'Generate flashcards from text using AI' })
  async generateFlashcards(
    @Body() dto: GenerateFlashcardsDto,
    @CurrentUser('id') _userId: number,
  ) {
    const cards = await this.aiService.generateFlashcards(dto.text);
    return { cards };
  }

  @Post('generate-quiz')
  @ApiOperation({ summary: 'Generate quiz questions from flashcards' })
  async generateQuiz(
    @Body() body: { flashcards: { front: string; back: string }[]; count?: number },
    @CurrentUser('id') _userId: number,
  ) {
    const questions = await this.aiService.generateQuizQuestions(
      body.flashcards,
      body.count || 10,
    );
    return { questions };
  }
}
