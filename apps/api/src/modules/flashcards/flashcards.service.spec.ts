import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FlashcardsService } from './flashcards.service';
import { Flashcard } from './flashcard.entity';
import { Deck } from '../decks/deck.entity';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { BatchCreateDto } from './dto/batch-create.dto';

describe('FlashcardsService', () => {
  let service: FlashcardsService;
  let flashcardsRepo: Partial<Repository<Flashcard>>;
  let decksRepo: Partial<Repository<Deck>>;

  const userId = 1;
  const otherUserId = 2;
  const deckId = 10;
  const flashcardId = 100;

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

  const mockFlashcard: Flashcard = {
    id: flashcardId,
    deckId,
    front: 'Question?',
    back: 'Answer!',
    position: 1,
    deck: mockDeck,
    reviews: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const createDto: CreateFlashcardDto = {
    front: 'Front text',
    back: 'Back text',
  };

  const updateDto: UpdateFlashcardDto = {
    front: 'Updated front',
  };

  beforeEach(() => {
    flashcardsRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      maximum: jest.fn(),
    };

    decksRepo = {
      findOne: jest.fn(),
    };

    service = new FlashcardsService(
      flashcardsRepo as Repository<Flashcard>,
      decksRepo as Repository<Deck>,
    );
  });

  // ------------------------------------------------------------------
  // findAll
  // ------------------------------------------------------------------
  describe('findAll', () => {
    it('should return flashcards for a deck owned by the user', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(mockDeck);
      const cards = [
        { ...mockFlashcard, id: 1, position: 1 },
        { ...mockFlashcard, id: 2, position: 2 },
      ];
      (flashcardsRepo.find as jest.Mock).mockResolvedValue(cards);

      const result = await service.findAll(deckId, userId);

      expect(decksRepo.findOne).toHaveBeenCalledWith({ where: { id: deckId } });
      expect(flashcardsRepo.find).toHaveBeenCalledWith({
        where: { deckId },
        order: { position: 'ASC', id: 'ASC' },
      });
      expect(result).toEqual(cards);
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findAll(deckId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findAll(deckId, userId)).rejects.toThrow(
        'Deck not found',
      );
    });

    it('should throw ForbiddenException when deck belongs to another user', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(mockDeck);

      await expect(
        service.findAll(deckId, otherUserId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findAll(deckId, otherUserId),
      ).rejects.toThrow('Access denied');
    });

    it('should return empty array when deck has no flashcards', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(mockDeck);
      (flashcardsRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(deckId, userId);

      expect(result).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // create
  // ------------------------------------------------------------------
  describe('create', () => {
    it('should create and return a flashcard in a deck owned by the user', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(mockDeck);
      const newCard = { ...mockFlashcard, id: 101, ...createDto, deckId };
      (flashcardsRepo.create as jest.Mock).mockReturnValue(newCard);
      (flashcardsRepo.save as jest.Mock).mockResolvedValue(newCard);

      const result = await service.create(deckId, createDto, userId);

      expect(decksRepo.findOne).toHaveBeenCalledWith({ where: { id: deckId } });
      expect(flashcardsRepo.create).toHaveBeenCalledWith({
        ...createDto,
        deckId,
      });
      expect(flashcardsRepo.save).toHaveBeenCalledWith(newCard);
      expect(result).toEqual(newCard);
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(deckId, createDto, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deck belongs to another user', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(mockDeck);

      await expect(
        service.create(deckId, createDto, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ------------------------------------------------------------------
  // update
  // ------------------------------------------------------------------
  describe('update', () => {
    const flashcardOwned: Flashcard = {
      ...mockFlashcard,
      deck: { ...mockDeck, userId },
    } as Flashcard;

    it('should update and return the flashcard owned by the user', async () => {
      (flashcardsRepo.findOne as jest.Mock).mockResolvedValueOnce(flashcardOwned);
      (flashcardsRepo.update as jest.Mock).mockResolvedValue({ affected: 1 });
      const updated = { ...flashcardOwned, front: 'Updated front' };
      (flashcardsRepo.findOne as jest.Mock).mockResolvedValueOnce(updated);

      const result = await service.update(flashcardId, updateDto, userId);

      expect(flashcardsRepo.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: flashcardId },
        relations: { deck: true },
      });
      expect(flashcardsRepo.update).toHaveBeenCalledWith(
        flashcardId,
        updateDto,
      );
      expect(flashcardsRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: { id: flashcardId },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when flashcard does not exist', async () => {
      (flashcardsRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(flashcardId, updateDto, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update(flashcardId, updateDto, userId),
      ).rejects.toThrow('Flashcard not found');
    });

    it('should throw ForbiddenException when deck owner is not the user', async () => {
      (flashcardsRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockFlashcard,
        deck: { ...mockDeck, userId: otherUserId },
      } as Flashcard);

      await expect(
        service.update(flashcardId, updateDto, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ------------------------------------------------------------------
  // delete
  // ------------------------------------------------------------------
  describe('delete', () => {
    const flashcardOwned: Flashcard = {
      ...mockFlashcard,
      deck: { ...mockDeck, userId },
    } as Flashcard;

    it('should delete a flashcard owned by the user', async () => {
      (flashcardsRepo.findOne as jest.Mock).mockResolvedValue(flashcardOwned);
      (flashcardsRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.delete(flashcardId, userId);

      expect(flashcardsRepo.findOne).toHaveBeenCalledWith({
        where: { id: flashcardId },
        relations: { deck: true },
      });
      expect(flashcardsRepo.delete).toHaveBeenCalledWith(flashcardId);
    });

    it('should throw NotFoundException when flashcard does not exist', async () => {
      (flashcardsRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(flashcardId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when deck owner is not the user', async () => {
      (flashcardsRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockFlashcard,
        deck: { ...mockDeck, userId: otherUserId },
      } as Flashcard);

      await expect(service.delete(flashcardId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ------------------------------------------------------------------
  // batchCreate
  // ------------------------------------------------------------------
  describe('batchCreate', () => {
    it('should create multiple flashcards with sequential positions starting after maxPosition', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(mockDeck);
      (flashcardsRepo.maximum as jest.Mock).mockResolvedValue(5);

      const cards = [
        { front: 'Q1', back: 'A1' },
        { front: 'Q2', back: 'A2' },
        { front: 'Q3', back: 'A3' },
      ];
      const dto: BatchCreateDto = { cards };

      const createdCards = [
        { ...cards[0], deckId, position: 6 },
        { ...cards[1], deckId, position: 7 },
        { ...cards[2], deckId, position: 8 },
      ];

      (flashcardsRepo.create as jest.Mock)
        .mockReturnValueOnce(createdCards[0])
        .mockReturnValueOnce(createdCards[1])
        .mockReturnValueOnce(createdCards[2]);

      (flashcardsRepo.save as jest.Mock).mockResolvedValue(createdCards);

      const result = await service.batchCreate(deckId, dto, userId);

      expect(decksRepo.findOne).toHaveBeenCalledWith({ where: { id: deckId } });
      expect(flashcardsRepo.maximum).toHaveBeenCalledWith('position', {
        deckId,
      });

      expect(flashcardsRepo.create).toHaveBeenNthCalledWith(1, {
        ...cards[0],
        deckId,
        position: 6,
      });
      expect(flashcardsRepo.create).toHaveBeenNthCalledWith(2, {
        ...cards[1],
        deckId,
        position: 7,
      });
      expect(flashcardsRepo.create).toHaveBeenNthCalledWith(3, {
        ...cards[2],
        deckId,
        position: 8,
      });

      expect(flashcardsRepo.save).toHaveBeenCalledWith(createdCards);
      expect(result).toEqual(createdCards);
    });

    it('should start positions at 1 when no existing flashcards', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(mockDeck);
      (flashcardsRepo.maximum as jest.Mock).mockResolvedValue(null);

      const dto: BatchCreateDto = {
        cards: [{ front: 'Q1', back: 'A1' }],
      };

      const created = { front: 'Q1', back: 'A1', deckId, position: 1 };
      (flashcardsRepo.create as jest.Mock).mockReturnValue(created);
      (flashcardsRepo.save as jest.Mock).mockResolvedValue([created]);

      const result = await service.batchCreate(deckId, dto, userId);

      expect(flashcardsRepo.maximum).toHaveBeenCalledWith('position', {
        deckId,
      });
      expect(flashcardsRepo.create).toHaveBeenCalledWith({
        front: 'Q1',
        back: 'A1',
        deckId,
        position: 1,
      });
      expect(result).toEqual([created]);
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.batchCreate(
          deckId,
          { cards: [{ front: 'Q', back: 'A' }] },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deck belongs to another user', async () => {
      (decksRepo.findOne as jest.Mock).mockResolvedValue(mockDeck);

      await expect(
        service.batchCreate(
          deckId,
          { cards: [{ front: 'Q', back: 'A' }] },
          otherUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
