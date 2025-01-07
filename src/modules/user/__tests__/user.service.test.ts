import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { UserService } from '../user.service';
import { NotFoundError } from '../../common/errors/graphql.error';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { IsFirebasePushId } from 'class-validator';

jest.mock('../../../config/logger');

describe('UserService', () => {
  let userService: UserService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    // Mock Prisma client
    prisma = mockDeep<PrismaClient>();
    Container.set(PrismaClient, prisma);
    userService = Container.get(UserService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async () => {

        const createDate = new Date();  
        const updateDate = new Date();
      // Arrange
      const mockUsers = [
        { id: 1, email: 'user1@example.com',firebaseUid: 'firebaseUid1', name: 'User 1', createdAt: createDate, updatedAt: updateDate },
        { id: 2, email: 'user2@example.com',firebaseUid: 'firebaseUid2', name: 'User 2', createdAt: createDate, updatedAt: updateDate }
      ];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should handle database error', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.user.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.findAll()).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const createDate = new Date();  
      const updateDate = new Date();
      const mockUser = { id: 1, email: 'test@example.com', firebaseUid: 'firebaseUid1', name: 'User 1', createdAt: createDate, updatedAt: updateDate };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await userService.findById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findById(1);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.user.findUnique.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.findById(1)).rejects.toThrow(error);
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      // Arrange
      const createDate = new Date();  
      const updateDate = new Date();
      const input = { email: 'new@example.com', name: 'New User' };
      const mockUser = { id: 1, firebaseUid: 'firebaseUid1', ...input, createdAt: createDate, updatedAt: updateDate };
      prisma.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await userService.create(input);

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: input
      });
    });

    it('should handle database error', async () => {
      // Arrange
      const input = { email: 'new@example.com', name: 'New User' };
      const error = new Error('Database error');
      prisma.user.create.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.create(input)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      // Arrange
      const createDate = new Date();  
      const updateDate = new Date();
      const input = { name: 'Updated Name',firebaseUid: 'firebaseUid1',createdAt: createDate, updatedAt: updateDate, };
      const mockUser = { id: 1, email: 'test@example.com', ...input };
      prisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await userService.update(1, input);

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input
      });
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const input = { name: 'Updated Name' };
      const error: any = new Error('Not found');
      error.code = 'P2025';
      prisma.user.update.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.update(1, input))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should handle other database errors', async () => {
      // Arrange
      const input = { name: 'Updated Name' };
      const error = new Error('Database error');
      prisma.user.update.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.update(1, input)).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
        const createDate = new Date();  
        const updateDate = new Date();
      // Arrange
      const mockUser = { id: 1, email: 'test@example.com', firebaseUid: 'firebaseUid1', name: 'User 1', createdAt: createDate, updatedAt: updateDate };
      prisma.user.delete.mockResolvedValue(mockUser);

      // Act
      await userService.delete(1);

      // Assert
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const error: any = new Error('Not found');
      error.code = 'P2025';
      prisma.user.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.delete(1))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should handle other database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.user.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.delete(1)).rejects.toThrow(error);
    });
  });
}); 