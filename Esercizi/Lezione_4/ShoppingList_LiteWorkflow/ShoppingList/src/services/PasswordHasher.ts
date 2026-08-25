export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export class BcryptHasher implements PasswordHasher {
  constructor(private readonly saltRounds: number = 10) {}

  async hash(plain: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(plain, hashed);
  }
}

export class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `fake:${plain}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `fake:${plain}`;
  }
}
