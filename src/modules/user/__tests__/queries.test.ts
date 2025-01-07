import 'reflect-metadata';
import { Container } from 'typedi';
import { UserQueries } from '../resolvers/queries';
import { UsersService } from '../../../services/userService';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('UserQueries', () => {
  let queries: UserQueries;
  let usersService: DeepMockProxy<UsersService>;

  beforeAll(() => {
    // Mock UsersService
    usersService = mockDeep<UsersService>();
    Container.set(UsersService, usersService);
    queries = Container.get(UserQueries);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('users', () => {
    it('should return all users', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, email: 'user1@example.com', name: 'User 1', firebaseUid: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, email: 'user2@example.com', name: 'User 2', firebaseUid: null, createdAt: new Date(), updatedAt: new Date() }
      ];
      usersService.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await queries.users();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(usersService.findAll).toHaveBeenCalled();
    });

    it('should handle service error', async () => {
      // Arrange
      const error = new Error('Service error');
      usersService.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(queries.users()).rejects.toThrow(error);
    });
  });

  describe('user', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { 
        id: 1, 
        email: 'test@example.com', 
        name: 'Test User',
        firebaseUid: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      usersService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await queries.user(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when user not found', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(null);

      // Act
      const result = await queries.user(1);

      // Assert
      expect(result).toBeNull();
      expect(usersService.findById).toHaveBeenCalledWith(1);
    });

    it('should handle service error', async () => {
      // Arrange
      const error = new Error('Service error');
      usersService.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(queries.user(1)).rejects.toThrow(error);
    });
  });
}); 