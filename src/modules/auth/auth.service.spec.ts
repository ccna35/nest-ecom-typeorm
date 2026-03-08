import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole, RefreshToken } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: {
    refreshToken: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 'u1',
    email: 'a@b.com',
    name: 'Test User',
    passwordHash: 'HASH',
    role: UserRole.customer,
    isActive: true,
    avatarUrl: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  });

  const buildRefreshToken = (user: User): RefreshToken => ({
    id: 't1',
    userId: user.id,
    tokenHash: 'HASHED',
    expiresAt: new Date('2024-02-01T00:00:00.000Z'),
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    revokedAt: null,
  });

  beforeEach(async () => {
    const mockPrismaService = {
      refreshToken: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { create: jest.fn(), findByEmail: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
    jwtService = moduleRef.get(JwtService);
    configService = moduleRef.get(ConfigService);
    prismaService = moduleRef.get(PrismaService) as typeof prismaService;

    configService.get.mockReturnValue(undefined);
  });

  it('signup: creates user and returns tokens + safe user', async () => {
    const createdUser = buildUser();
    usersService.create.mockResolvedValue(createdUser);
    jwtService.signAsync
      .mockResolvedValueOnce('ACCESS_TOKEN')
      .mockResolvedValueOnce('REFRESH_TOKEN');
    (bcrypt.hash as jest.Mock).mockResolvedValue('HASHED');
    prismaService.refreshToken.create.mockResolvedValue(buildRefreshToken(createdUser));

    const result = await authService.signup({
      email: 'a@b.com',
      name: 'Test User',
      password: 'pass',
    });

    expect(usersService.create).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'Test User',
      password: 'pass',
      role: UserRole.customer,
    });
    expect(result).toMatchObject({
      user: { id: 'u1', email: 'a@b.com' },
      tokens: { accessToken: 'ACCESS_TOKEN', refreshToken: 'REFRESH_TOKEN' },
    });
  });

  it('validateUser: returns user if password matches', async () => {
    const testUser = buildUser();
    usersService.findByEmail.mockResolvedValue(testUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const user = await authService.validateUser('a@b.com', 'pass');

    expect(user).toMatchObject({ id: 'u1', email: 'a@b.com' });
  });

  it('validateUser: returns null if user not found', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    const user = await authService.validateUser('x@y.com', 'pass');

    expect(user).toBeNull();
  });

  it('validateUser: returns null if user is inactive', async () => {
    usersService.findByEmail.mockResolvedValue(buildUser({ isActive: false }));

    const user = await authService.validateUser('a@b.com', 'pass');

    expect(user).toBeNull();
  });

  it('validateUser: returns null if password does not match', async () => {
    usersService.findByEmail.mockResolvedValue(buildUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const user = await authService.validateUser('a@b.com', 'wrong');

    expect(user).toBeNull();
  });

  it('login: returns tokens and safe user', async () => {
    const testUser = buildUser();
    jwtService.signAsync
      .mockResolvedValueOnce('ACCESS_TOKEN')
      .mockResolvedValueOnce('REFRESH_TOKEN');
    (bcrypt.hash as jest.Mock).mockResolvedValue('HASHED');
    prismaService.refreshToken.create.mockResolvedValue(buildRefreshToken(testUser));

    const result = await authService.login(testUser);

    expect(result).toMatchObject({
      user: { id: 'u1', email: 'a@b.com' },
      tokens: { accessToken: 'ACCESS_TOKEN', refreshToken: 'REFRESH_TOKEN' },
    });
  });

  it('refresh: rotates refresh token and returns new tokens', async () => {
    const testUser = buildUser();
    const activeToken = buildRefreshToken(testUser);
    jwtService.verifyAsync.mockResolvedValue({ userId: testUser.id, role: testUser.role });
    prismaService.refreshToken.findMany.mockResolvedValue([activeToken]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    usersService.findOne.mockResolvedValue(testUser);
    jwtService.signAsync
      .mockResolvedValueOnce('ACCESS_TOKEN')
      .mockResolvedValueOnce('REFRESH_TOKEN');
    (bcrypt.hash as jest.Mock).mockResolvedValue('HASHED');
    prismaService.refreshToken.create.mockResolvedValue(buildRefreshToken(testUser));
    prismaService.refreshToken.update.mockResolvedValue({ ...activeToken, revokedAt: new Date() });

    const result = await authService.refresh('REFRESH_TOKEN');

    expect(result).toMatchObject({
      user: { id: 'u1', email: 'a@b.com' },
      tokens: { accessToken: 'ACCESS_TOKEN', refreshToken: 'REFRESH_TOKEN' },
    });
    expect(prismaService.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: activeToken.id },
        data: { revokedAt: expect.any(Date) },
      }),
    );
  });

  it('refresh: throws when refresh token is not recognized', async () => {
    const testUser = buildUser();
    jwtService.verifyAsync.mockResolvedValue({ userId: testUser.id, role: testUser.role });
    prismaService.refreshToken.findMany.mockResolvedValue([]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(authService.refresh('REFRESH_TOKEN')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh: throws when refresh token is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('bad'));

    await expect(authService.refresh('BAD_TOKEN')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout: returns early when no token provided', async () => {
    await expect(authService.logout()).resolves.toBeUndefined();
  });

  it('logout: revokes active refresh token when provided', async () => {
    const testUser = buildUser();
    const activeToken = buildRefreshToken(testUser);
    jwtService.verifyAsync.mockResolvedValue({ userId: testUser.id, role: testUser.role });
    prismaService.refreshToken.findMany.mockResolvedValue([activeToken]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    prismaService.refreshToken.update.mockResolvedValue({ ...activeToken, revokedAt: new Date() });

    await authService.logout('REFRESH_TOKEN');

    expect(prismaService.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: activeToken.id },
        data: { revokedAt: expect.any(Date) },
      }),
    );
  });

  it('logout: ignores invalid token errors', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('bad'));

    await expect(authService.logout('BAD_TOKEN')).resolves.toBeUndefined();
  });

  it('setAuthCookies: sets access and refresh cookies', () => {
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    authService.setAuthCookies(response as never, {
      accessToken: 'ACCESS_TOKEN',
      refreshToken: 'REFRESH_TOKEN',
    });

    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'ACCESS_TOKEN',
      expect.objectContaining({ maxAge: 5 * 60 * 1000 }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'REFRESH_TOKEN',
      expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 * 1000 }),
    );
  });

  it('clearAuthCookies: clears access and refresh cookies', () => {
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    authService.clearAuthCookies(response as never);

    expect(response.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
  });
});
