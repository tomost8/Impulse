import 'reflect-metadata';
import { Container } from 'typedi';
import { UserMutations } from '../resolvers/mutations';
import { UsersService } from '../../../services/userService';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateUserInput, UpdateUserInput } from '../schema/inputs';
import { User } from '../schema/types';

describe('UserMutations', () => {
  let mutations: UserMutations;
  let usersService: DeepMockProxy<UsersService>;

  beforeAll(() => {
    // Mock UsersService
    usersService = mockDeep<UsersService>();
    Container.set(UsersService, usersService);
    mutations = Container.get(UserMutations);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      // Arrange
      const createDate = new Date();
      const updateDate = new Date();
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        firebaseUid: 'firebaseUid1'
      };
      const mockUser: User = {
        id: 1,
        email: input.email,
        name: input.name || null,
        firebaseUid: input.firebaseUid || null,
        createdAt: createDate,
        updatedAt: updateDate
      };
      usersService.create.mockResolvedValue(mockUser);

      // Act
      const result = await mutations.createUser(input);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersService.create).toHaveBeenCalledWith(input);
    });

    it('should handle service error', async () => {
      // Arrange
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        firebaseUid: 'firebaseUid1'
      };
      const error = new Error('Service error');
      usersService.create.mockRejectedValue(error);

      // Act & Assert
      await expect(mutations.createUser(input)).rejects.toThrow(error);
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      // Arrange
      const createDate = new Date();
      const updateDate = new Date();
      const id = 1;
      const input: UpdateUserInput = {
        name: 'Updated User'
      };
      const mockUser: User = {
        id,
        email: 'test@example.com',
        name: input.name || null,
        firebaseUid: 'firebaseUid1',
        createdAt: createDate,
        updatedAt: updateDate
      };
      usersService.update.mockResolvedValue(mockUser);

      // Act
      const result = await mutations.updateUser(id, input);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersService.update).toHaveBeenCalledWith(id, input);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const id = 1;
      const input: UpdateUserInput = {
        name: 'Updated User'
      };
      const error = new Error('Not found');
      usersService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(mutations.updateUser(id, input)).rejects.toThrow(error);
    });

    it('should handle service error', async () => {
      // Arrange
      const id = 1;
      const input: UpdateUserInput = {
        name: 'Updated User'
      };
      const error = new Error('Service error');
      usersService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(mutations.updateUser(id, input)).rejects.toThrow(error);
    });
  });

  describe('deleteUser', () => {
    it('should delete and return true when successful', async () => {
      // Arrange
      const id = 1;
      const createDate = new Date();
      const updateDate = new Date();
      const mockUser: User = { 
        id, 
        email: 'test@example.com', 
        firebaseUid: 'firebaseUid1', 
        name: 'User 1', 
        createdAt: createDate, 
        updatedAt: updateDate 
      };
      usersService.delete.mockResolvedValue();

      // Act
      const result = await mutations.deleteUser(id);

      // Assert
      expect(result).toBe(true);
      expect(usersService.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const id = 1;
      const error = new Error('Not found');
      usersService.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(mutations.deleteUser(id)).rejects.toThrow(error);
    });

    it('should handle service error', async () => {
      // Arrange
      const id = 1;
      const error = new Error('Service error');
      usersService.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(mutations.deleteUser(id)).rejects.toThrow(error);
    });
  });
}); 