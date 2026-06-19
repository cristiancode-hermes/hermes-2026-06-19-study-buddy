import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Deck } from './deck.entity';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { Flashcard } from '../flashcards/flashcard.entity';
import { StudyReview } from '../study/study-review.entity';

@Injectable()
export class DecksService {
  constructor(
    @InjectRepository(Deck)
    private readonly decksRepository: Repository<Deck>,
    @InjectRepository(Flashcard)
    private readonly flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(StudyReview)
    private readonly studyReviewsRepository: Repository<StudyReview>,
  ) {}

  async findAll(userId: number, search?: string) {
    const where: any = { userId };
    if (search) {
      where.name = Like(`%${search}%`);
    }

    const decks = await this.decksRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    const results = await Promise.all(
      decks.map(async (deck) => {
        const cardCount = await this.flashcardsRepository.count({
          where: { deckId: deck.id },
        });

        const today = new Date().toISOString().split('T')[0];
        const dueCount = await this.flashcardsRepository
          .createQueryBuilder('f')
          .innerJoin(StudyReview, 'sr', 'sr.flashcardId = f.id')
          .where('f.deckId = :deckId', { deckId: deck.id })
          .andWhere('sr.userId = :userId', { userId })
          .andWhere('sr.nextReview <= :today', { today })
          .getCount();

        return {
          ...deck,
          cardCount,
          dueCount,
        };
      }),
    );

    return results;
  }

  async findById(id: number, userId: number) {
    const deck = await this.decksRepository.findOne({
      where: { id },
      relations: { flashcards: true },
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return deck;
  }

  async create(dto: CreateDeckDto, userId: number) {
    const deck = this.decksRepository.create({
      ...dto,
      userId,
    });
    return this.decksRepository.save(deck);
  }

  async update(id: number, dto: UpdateDeckDto, userId: number) {
    const deck = await this.decksRepository.findOne({ where: { id } });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.decksRepository.update(id, dto);
    return this.decksRepository.findOne({ where: { id } });
  }

  async delete(id: number, userId: number) {
    const deck = await this.decksRepository.findOne({ where: { id } });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    if (deck.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.decksRepository.delete(id);
  }
}
