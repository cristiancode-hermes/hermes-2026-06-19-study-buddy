import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flashcard } from './flashcard.entity';
import { Deck } from '../decks/deck.entity';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { BatchCreateDto } from './dto/batch-create.dto';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectRepository(Flashcard)
    private readonly flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(Deck)
    private readonly decksRepository: Repository<Deck>,
  ) {}

  async findAll(deckId: number, userId: number) {
    const deck = await this.decksRepository.findOne({ where: { id: deckId } });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.flashcardsRepository.find({
      where: { deckId },
      order: { position: 'ASC', id: 'ASC' },
    });
  }

  async create(deckId: number, dto: CreateFlashcardDto, userId: number) {
    const deck = await this.decksRepository.findOne({ where: { id: deckId } });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const flashcard = this.flashcardsRepository.create({
      ...dto,
      deckId,
    });
    return this.flashcardsRepository.save(flashcard);
  }

  async update(id: number, dto: UpdateFlashcardDto, userId: number) {
    const flashcard = await this.flashcardsRepository.findOne({
      where: { id },
      relations: { deck: true },
    });
    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }
    if (flashcard.deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.flashcardsRepository.update(id, dto);
    return this.flashcardsRepository.findOne({ where: { id } });
  }

  async delete(id: number, userId: number) {
    const flashcard = await this.flashcardsRepository.findOne({
      where: { id },
      relations: { deck: true },
    });
    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }
    if (flashcard.deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.flashcardsRepository.delete(id);
  }

  async batchCreate(deckId: number, dto: BatchCreateDto, userId: number) {
    const deck = await this.decksRepository.findOne({ where: { id: deckId } });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const maxPosition = await this.flashcardsRepository.maximum('position', { deckId });

    const flashcards = dto.cards.map((card, index) =>
      this.flashcardsRepository.create({
        ...card,
        deckId,
        position: (maxPosition ?? 0) + index + 1,
      }),
    );

    return this.flashcardsRepository.save(flashcards);
  }
}
