// auth.service.spec.ts
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmail: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn() },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
    jwtService = moduleRef.get(JwtService);
  });

  it('validateUser: returns user if password matches', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'HASH',
    } as any);

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const user = await authService.validateUser('a@b.com', 'pass');
    expect(user).toMatchObject({ id: 'u1', email: 'a@b.com' });
  });

  it('validateUser: returns null if user not found', async () => {
    usersService.findByEmail.mockResolvedValue(null as any);

    const user = await authService.validateUser('x@y.com', 'pass');
    expect(user).toBeNull();
  });

  it('login: returns access token', async () => {
    jwtService.signAsync.mockResolvedValue('ACCESS_TOKEN');

    const result = await authService.login({ id: 'u1', email: 'a@b.com' } as any);
    expect(result).toEqual({ accessToken: 'ACCESS_TOKEN' });
    expect(jwtService.signAsync).toHaveBeenCalled();
  });
});
