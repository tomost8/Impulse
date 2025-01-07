// src/routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { createValidator } from '../middlewares/validator';
import { createUserSchema } from '../schemas/user.schema';

export const createUserRoutes = () => {
  const router = Router();
  const userService = new UserService();
  const userController = new UserController(userService);

  router.post('/', createValidator(createUserSchema), userController.createUser);
  router.get('/', userController.getUsers);

  return router;
};