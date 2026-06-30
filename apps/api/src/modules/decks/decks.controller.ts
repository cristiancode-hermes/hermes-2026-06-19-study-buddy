import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Decks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/decks')
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all decks for current user' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser('id') userId: number,
    @Query('search') search?: string,
  ) {
    return this.decksService.findAll(userId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a deck by ID with its flashcards' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.decksService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new deck' })
  async create(@Body() dto: CreateDeckDto, @CurrentUser('id') userId: number) {
    return this.decksService.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deck' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeckDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.decksService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deck' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.decksService.delete(id, userId);
  }
}
