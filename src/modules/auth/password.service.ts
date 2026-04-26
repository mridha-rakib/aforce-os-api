import bcrypt from 'bcryptjs';

const PASSWORD_SALT_ROUNDS = 12;

export class PasswordService {
  public async hash(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }

  public async verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}

export const passwordService = new PasswordService();
