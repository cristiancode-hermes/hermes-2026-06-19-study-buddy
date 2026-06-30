import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository, Like } from 'typeorm';
import { DecksService } from './decks.service';
import { Deck } from './deck.entity';
import { Flashcard } from '../flashcards/flashcard.entity';
import { StudyReview } from '../study/study-review.entity';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

describe('DecksService', () => {
  let service: DecksService;
  let decksRepo: jest.Mocked<Partial<Repository<Deck>>>;
  let flashcardsRepo: jest.Mocked<Partial<Repository<Flashcard>>>;
  let studyReviewsRepo: jest.Mocked<Partial<Repository<StudyReview>>>;

  const userId = 1;
  const otherUserId = 2;
  const deckId = 10;

  const mockDeck: Deck = {
    id: deckId,
    userId,
    name: 'Test Deck',
    description: 'A test deck',
    user: null as any,
    flashcards: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCreateDto: CreateDeckDto = { name: 'New Deck', description: 'Desc' };
  const mockUpdateDto: UpdateDeckDto = { name: 'Updated Deck' };

  beforeEach(() => {
    decksRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    flashcardsRepo = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    studyReviewsRepo = {} as any;

    service = new DecksService(
      decksRepo as unknown as Repository<Deck>,
      flashcardsRepo as unknown as Repository<Flashcard>,
      studyReviewsRepo as unknown as Repository<StudyReview>,
    );
  });

  // ------------------------------------------------------------------
  // findAll
  // ------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all decks for the user with cardCount and dueCount', async () => {
      const deckA = { ...mockDeck, id: 1, name: 'A' };
      const deckB = { ...mockDeck, id: 2, name: 'B' };
      decksRepo.find!.mockResolvedValue([deckA, deckB]);

      flashcardsRepo.count!.mockResolvedValue(5);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };
      flashcardsRepo.createQueryBuilder!.mockReturnValue(mockQueryBuilder as any);

      const results = await service.findAll(userId);

      expect(decksRepo.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ ...deckA, cardCount: 5, dueCount: 3 });
      expect(results[1]).toEqual({ ...deckB, cardCount: 5, dueCount: 3 });
    });

    it('should filter decks by search term using LIKE', async () => {
      decksRepo.find!.mockResolvedValue([mockDeck]);
      flashcardsRepo.count!.mockResolvedValue(0);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      flashcardsRepo.createQueryBuilder!.mockReturnValue(mockQueryBuilder as any);

      const results = await service.findAll(userId, 'Test');

      expect(decksRepo.find).toHaveBeenCalledWith({
        where: { userId, name: Like('%Test%') },
        order: { createdAt: 'DESC' },
      });
      expect(results).toHaveLength(1);
    });

    it('should return empty array when user has no decks', async () => {
      decksRepo.find!.mockResolvedValue([]);

      const results = await service.findAll(userId);

      expect(results).toEqual([]);
    });

    it('should handle differing due counts per deck', async () => {
      const deckA = { ...mockDeck, id: 1, name: 'A' };
      const deckB = { ...mockDeck, id: 2, name: 'B' };
      decksRepo.find!.mockResolvedValue([deckA, deckB]);

      flashcardsRepo.count!.mockResolvedValue(3);

      const qbA = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      const qbB = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      flashcardsRepo.createQueryBuilder!
        .mockReturnValueOnce(qbA as any)
        .mockReturnValueOnce(qbB as any);

      const results = await service.findAll(userId);

      expect(results[0].dueCount).toBe(2);
      expect(results[1].dueCount).toBe(5);
    });
  });

  // ------------------------------------------------------------------
  // findById
  // ------------------------------------------------------------------
  describe('findById', () => {
    it('should find and return a deck owned by the user', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      const result = await service.findById(deckId, userId);

      expect(decksRepo.findOne).toHaveBeenCalledWith({
        where: { id: deckId },
        relations: { flashcards: true },
      });
      expect(result).toEqual(mockDeck);
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      decksRepo.findOne!.mockResolvedValue(null);

      await expect(service.findById(deckId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(deckId, userId)).rejects.toThrow(
        'Deck not found',
      );
    });

    it('should throw ForbiddenException when deck belongs to another user', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      await expect(
        service.findById(deckId, otherUserId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findById(deckId, otherUserId),
      ).rejects.toThrow('Access denied');
    });
  });

  // ------------------------------------------------------------------
  // create
  // ------------------------------------------------------------------
  describe('create', () => {
    it('should create and return a new deck', async () => {
      const createdDeck = { ...mockDeck, name: 'New Deck' };
      decksRepo.create!.mockReturnValue(createdDeck);
      decksRepo.save!.mockResolvedValue(createdDeck);

      const result = await service.create(mockCreateDto, userId);

      expect(decksRepo.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        userId,
      });
      expect(decksRepo.save).toHaveBeenCalledWith(createdDeck);
      expect(result).toEqual(createdDeck);
    });
  });

  // ------------------------------------------------------------------
  // update
  // ------------------------------------------------------------------
  describe('update', () => {
    it('should update and return the deck', async () => {
      decksRepo.findOne!.mockResolvedValueOnce(mockDeck);
      decksRepo.update!.mockResolvedValue({ affected: 1 } as any);
      const updatedDeck = { ...mockDeck, name: 'Updated Deck' };
      decksRepo.findOne!.mockResolvedValueOnce(updatedDeck);

      const result = await service.update(deckId, mockUpdateDto, userId);

      expect(decksRepo.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: deckId },
      });
      expect(decksRepo.update).toHaveBeenCalledWith(deckId, mockUpdateDto);
      expect(decksRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: { id: deckId },
      });
      expect(result).toEqual(updatedDeck);
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      decksRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.update(deckId, mockUpdateDto, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deck belongs to another user', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      await expect(
        service.update(deckId, mockUpdateDto, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ------------------------------------------------------------------
  // delete
  // ------------------------------------------------------------------
  describe('delete', () => {
    it('should delete a deck owned by the user', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);
      decksRepo.delete!.mockResolvedValue({ affected: 1 } as any);

      await service.delete(deckId, userId);

      expect(decksRepo.findOne).toHaveBeenCalledWith({ where: { id: deckId } });
      expect(decksRepo.delete).toHaveBeenCalledWith(deckId);
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      decksRepo.findOne!.mockResolvedValue(null);

      await expect(service.delete(deckId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when deck belongs to another user', async () => {
      decksRepo.findOne!.mockResolvedValue(mockDeck);

      await expect(service.delete(deckId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
