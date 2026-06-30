import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcryptjs at module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: Partial<UsersService>;
  let mockJwtService: Partial<JwtService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    name: 'Test User',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  const mockRegisterDto = {
    email: 'new@example.com',
    password: 'securePassword123',
    name: 'New User',
  };

  const mockLoginDto = {
    email: 'test@example.com',
    password: 'correctPassword',
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    service = new AuthService(
      mockUsersService as UsersService,
      mockJwtService as JwtService,
    );

    // Default bcrypt mocks
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$newhashedpassword');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    it('should register a new user and return token + user without passwordHash', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUsersService.create as jest.Mock).mockResolvedValue(mockUser);
      (mockJwtService.sign as jest.Mock).mockReturnValue('jwt-token-123');

      const result = await service.register(mockRegisterDto);

      expect(result).toEqual({
        token: 'jwt-token-123',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
      // User object should not contain passwordHash
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should check existing user by email and hash password before creating', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUsersService.create as jest.Mock).mockResolvedValue(mockUser);
      (mockJwtService.sign as jest.Mock).mockReturnValue('token');

      await service.register(mockRegisterDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'new@example.com',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('securePassword123', 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        passwordHash: '$2a$10$newhashedpassword',
        name: 'New User',
      });
    });

    it('should throw ConflictException if email already registered', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'Email already registered',
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'new@example.com',
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should sign JWT with correct payload (sub + email)', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUsersService.create as jest.Mock).mockResolvedValue(mockUser);
      (mockJwtService.sign as jest.Mock).mockReturnValue('jwt-token-456');

      await service.register(mockRegisterDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should handle registration without name (name undefined)', async () => {
      const minimalDto = {
        email: 'noname@example.com',
        password: 'password123',
      };
      const userWithoutName = { ...mockUser, email: 'noname@example.com', name: null };

      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUsersService.create as jest.Mock).mockResolvedValue(userWithoutName);
      (mockJwtService.sign as jest.Mock).mockReturnValue('token');

      const result = await service.register(minimalDto as any);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'noname@example.com',
        passwordHash: '$2a$10$newhashedpassword',
        name: undefined,
      });
      expect(result.user.name).toBeNull();
    });

    it('should propagate errors from usersService.create', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUsersService.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials and return token + user without passwordHash', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwtService.sign as jest.Mock).mockReturnValue('jwt-token-login');

      const result = await service.login(mockLoginDto);

      expect(result).toEqual({
        token: 'jwt-token-login',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should find user by email and compare password', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwtService.sign as jest.Mock).mockReturnValue('token');

      await service.login(mockLoginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        mockUser.passwordHash,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should sign JWT with correct payload on successful login', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwtService.sign as jest.Mock).mockReturnValue('login-token');

      await service.login(mockLoginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should handle login with case-sensitive email matching', async () => {
      // UsersService.findByEmail handles the actual lookup; we test that
      // the correct email is passed through without transformation
      const loginDtoWithCase = {
        email: 'Test@Example.com',
        password: 'password123',
      };

      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDtoWithCase)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'Test@Example.com',
      );
    });

    it('should propagate errors from usersService.findByEmail', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Connection refused',
      );
    });
  });
});
