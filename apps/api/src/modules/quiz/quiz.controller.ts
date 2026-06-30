import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Quiz')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get(':deckId/generate')
  @ApiOperation({ summary: 'Generate quiz questions for a deck' })
  @ApiQuery({ name: 'count', required: false })
  async generate(
    @Param('deckId', ParseIntPipe) deckId: number,
    @Query('count') count: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.quizService.generateQuiz(
      deckId,
      userId,
      count ? parseInt(count, 10) : 10,
    );
  }

  @Post(':deckId/result')
  @ApiOperation({ summary: 'Submit quiz results' })
  async submitResult(
    @Param('deckId', ParseIntPipe) deckId: number,
    @Body() dto: SubmitQuizDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.quizService.submitResult(deckId, userId, dto.results);
  }
}
