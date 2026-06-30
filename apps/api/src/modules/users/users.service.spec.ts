import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: Partial<Repository<User>>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    name: 'Test User',
    decks: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    service = new UsersService(
      mockRepository as Repository<User>,
    );
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when user is not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when email is not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const createData: Partial<User> = {
        email: 'new@example.com',
        passwordHash: '$2a$10$newhash',
        name: 'New User',
      };
      const createdUser = {
        id: 2,
        ...createData,
        decks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(createData);

      expect(result).toEqual(createdUser);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
    });

    it('should create a user with minimal data (no name)', async () => {
      const createData: Partial<User> = {
        email: 'minimal@example.com',
        passwordHash: '$2a$10$hash',
      };
      const createdUser = {
        id: 3,
        ...createData,
        name: null,
        decks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(createData);

      expect(result).toEqual(createdUser);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
    });

    it('should propagate repository errors', async () => {
      const createData: Partial<User> = {
        email: 'duplicate@example.com',
        passwordHash: '$2a$10$hash',
      };

      (mockRepository.create as jest.Mock).mockReturnValue(createData);
      (mockRepository.save as jest.Mock).mockRejectedValue(
        new Error('Duplicate email'),
      );

      await expect(service.create(createData)).rejects.toThrow('Duplicate email');
    });
  });

  describe('update', () => {
    it('should update user data and return the updated user', async () => {
      const updateData: Partial<User> = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (mockRepository.findOne as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when updating a non-existent user', async () => {
      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 0 });
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update(999, { name: 'Ghost' });

      expect(result).toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(999, { name: 'Ghost' });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });

    it('should update email and passwordHash', async () => {
      const updateData: Partial<User> = {
        email: 'updated@example.com',
        passwordHash: '$2a$10$newhash',
      };
      const updatedUser = { ...mockUser, ...updateData };

      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (mockRepository.findOne as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
    });
  });
});
