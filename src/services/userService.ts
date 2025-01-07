import prisma from '../database/client';

export class UserService {
  async createUser(data: { email: string; name?: string }) {
    return prisma.user.create({
      data
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async getAllUsers() {
    return prisma.user.findMany();
  }
}