import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StudyService } from './study.service';
import { RateCardDto } from './dto/rate-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Study')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/study')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Get(':deckId/due')
  @ApiOperation({ summary: 'Get flashcards due for review in a deck' })
  async getDue(
    @Param('deckId', ParseIntPipe) deckId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.studyService.getDueCards(deckId, userId);
  }

  @Post('rate')
  @ApiOperation({ summary: 'Rate a flashcard after review (SM-2 algorithm)' })
  async rate(@Body() dto: RateCardDto, @CurrentUser('id') userId: number) {
    return this.studyService.rateCard(dto, userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get study statistics for current user' })
  async stats(@CurrentUser('id') userId: number) {
    return this.studyService.getStats(userId);
  }
}
