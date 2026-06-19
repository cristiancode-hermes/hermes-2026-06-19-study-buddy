import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { BatchCreateDto } from './dto/batch-create.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Flashcards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Get('api/decks/:deckId/flashcards')
  @ApiOperation({ summary: 'Get all flashcards in a deck' })
  async findAll(
    @Param('deckId', ParseIntPipe) deckId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.flashcardsService.findAll(deckId, userId);
  }

  @Post('api/decks/:deckId/flashcards')
  @ApiOperation({ summary: 'Create a flashcard in a deck' })
  async create(
    @Param('deckId', ParseIntPipe) deckId: number,
    @Body() dto: CreateFlashcardDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.flashcardsService.create(deckId, dto, userId);
  }

  @Post('api/decks/:deckId/flashcards/batch')
  @ApiOperation({ summary: 'Batch create flashcards in a deck' })
  async batchCreate(
    @Param('deckId', ParseIntPipe) deckId: number,
    @Body() dto: BatchCreateDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.flashcardsService.batchCreate(deckId, dto, userId);
  }

  @Patch('api/flashcards/:id')
  @ApiOperation({ summary: 'Update a flashcard' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFlashcardDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.flashcardsService.update(id, dto, userId);
  }

  @Delete('api/flashcards/:id')
  @ApiOperation({ summary: 'Delete a flashcard' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.flashcardsService.delete(id, userId);
  }
}
