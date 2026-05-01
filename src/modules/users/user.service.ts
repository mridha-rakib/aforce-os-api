import {
  DuplicateResourceError,
  ResourceNotFoundError,
} from '../../common/errors/http-errors';
import {
  userRepository,
  type ListUsersInput,
  type UserRecord,
  type UserRepository,
} from './user.repository';
import type {
  CreateAdminUserInput,
  ListAdminUsersQuery,
  UpdateAdminUserInput,
} from './user.schema';

export interface AdminUserDto {
  readonly avatar?: string;
  readonly createdAt: Date;
  readonly email: string;
  readonly hydrationScore: number;
  readonly id: string;
  readonly joinDate: string;
  readonly name: string;
  readonly status: 'Active' | 'Blocked';
  readonly subscription: 'Free' | 'Pro' | 'Enterprise';
  readonly updatedAt: Date;
}

export class UserService {
  public constructor(private readonly repository: UserRepository) {}

  public async createUser(input: CreateAdminUserInput): Promise<AdminUserDto> {
    const existingUser = await this.repository.findByEmail(input.email);

    if (existingUser) {
      throw new DuplicateResourceError('user', { email: input.email });
    }

    const user = await this.repository.create({
      displayName: input.name,
      email: input.email,
      hydrationScore: input.hydrationScore,
      providers: {
        password: false,
      },
      role: 'user',
      status: input.status,
      subscription: input.subscription,
    });

    return this.toAdminUserDto(user);
  }

  public async listUsers(query: ListAdminUsersQuery): Promise<AdminUserDto[]> {
    const filter: ListUsersInput = {
      ...(query.search ? { search: query.search } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.subscription ? { subscription: query.subscription } : {}),
    };
    const users = await this.repository.findMany(filter);

    return users.map((user) => this.toAdminUserDto(user));
  }

  public async deleteUser(userId: string): Promise<{ userId: string }> {
    const deletedUser = await this.repository.deleteById(userId);

    if (!deletedUser) {
      throw new ResourceNotFoundError('user', { userId });
    }

    return { userId };
  }

  public async updateUser(userId: string, input: UpdateAdminUserInput): Promise<AdminUserDto> {
    if (input.email) {
      const existingUser = await this.repository.findByEmail(input.email);

      if (existingUser && existingUser.id !== userId) {
        throw new DuplicateResourceError('user', { email: input.email });
      }
    }

    const user = await this.repository.updateById(userId, {
      ...(input.email ? { email: input.email } : {}),
      ...(input.hydrationScore !== undefined ? { hydrationScore: input.hydrationScore } : {}),
      ...(input.name ? { displayName: input.name } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.subscription ? { subscription: input.subscription } : {}),
    });

    if (!user) {
      throw new ResourceNotFoundError('user', { userId });
    }

    return this.toAdminUserDto(user);
  }

  private toAdminUserDto(user: UserRecord): AdminUserDto {
    const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ');

    return {
      createdAt: user.createdAt,
      email: user.email,
      hydrationScore: user.hydrationScore,
      id: user.id,
      joinDate: this.formatJoinDate(user.createdAt),
      name: (user.displayName ?? fallbackName) || user.email,
      status: user.status,
      subscription: user.subscription,
      updatedAt: user.updatedAt,
      ...(user.avatarUrl ? { avatar: user.avatarUrl } : {}),
    };
  }

  private formatJoinDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}

export const userService = new UserService(userRepository);
