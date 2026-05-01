import { BaseController } from '../../common/http/base-controller';
import { userService, type UserService } from './user.service';
import type {
  CreateAdminUserInput,
  UserParams,
  UpdateAdminUserInput,
} from './user.schema';

export class UserController extends BaseController {
  public constructor(private readonly service: UserService) {
    super();
  }

  public readonly createUser = this.handleRequest(async (request, response) => {
    const user = await this.service.createUser(request.body as CreateAdminUserInput);
    this.created(response, 'User created successfully.', user);
  });

  public readonly listUsers = this.handleRequest(async (request, response) => {
    const users = await this.service.listUsers(request.query);
    this.ok(response, 'Users fetched successfully.', users);
  });

  public readonly deleteUser = this.handleRequest(async (request, response) => {
    const result = await this.service.deleteUser((request.params as UserParams).userId);
    this.ok(response, 'User deleted successfully.', result);
  });

  public readonly updateUser = this.handleRequest(async (request, response) => {
    const user = await this.service.updateUser(
      (request.params as UserParams).userId,
      request.body as UpdateAdminUserInput,
    );
    this.ok(response, 'User updated successfully.', user);
  });
}

export const userController = new UserController(userService);
