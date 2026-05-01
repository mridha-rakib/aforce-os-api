import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import { authenticate, requireRole } from '../../common/middleware/auth.middleware';
import { userController, type UserController } from './user.controller';
import {
  createUserRequestSchema,
  listUsersRequestSchema,
  userParamsRequestSchema,
  updateUserRequestSchema,
} from './user.schema';

export class UserRoute extends BaseRoute {
  public constructor(private readonly controller: UserController) {
    super('/users', 'admin');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.get(
      '/',
      { audience: 'admin', name: 'List Users' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(listUsersRequestSchema),
      this.controller.listUsers,
    );
    this.post(
      '/',
      { audience: 'admin', name: 'Create User' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(createUserRequestSchema),
      this.controller.createUser,
    );
    this.patch(
      '/:userId',
      { audience: 'admin', name: 'Update User' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(updateUserRequestSchema),
      this.controller.updateUser,
    );
    this.delete(
      '/:userId',
      { audience: 'admin', name: 'Delete User' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(userParamsRequestSchema),
      this.controller.deleteUser,
    );
  }
}

export const userRoute = new UserRoute(userController);
