import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../users/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'u1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'ACCESS_TOKEN',
    refreshToken: 'REFRESH_TOKEN',
  };

  const mockResponse = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  });

  const mockRequest = (cookies: Record<string, string> = {}) => ({
    cookies,
    user: mockUser,
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            setAuthCookies: jest.fn(),
            clearAuthCookies: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('signup', () => {
    it('should create user, set cookies, and return user', async () => {
      const dto = { email: 'test@example.com', name: 'Test User', password: 'password123' };
      authService.signup.mockResolvedValue({ user: mockUser, tokens: mockTokens });
      const response = mockResponse();

      const result = await controller.signup(dto, response as any);

      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(authService.setAuthCookies).toHaveBeenCalledWith(response, mockTokens);
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('login', () => {
    it('should login user, set cookies, and return user', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const request = mockRequest();
      authService.login.mockResolvedValue({ user: mockUser, tokens: mockTokens });
      const response = mockResponse();

      const result = await controller.login(request as any, response as any, dto);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(authService.setAuthCookies).toHaveBeenCalledWith(response, mockTokens);
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens, set cookies, and return user', async () => {
      const request = mockRequest({ refresh_token: 'OLD_REFRESH' });
      authService.refresh.mockResolvedValue({ user: mockUser, tokens: mockTokens });
      const response = mockResponse();

      const result = await controller.refresh(request as any, response as any);

      expect(authService.refresh).toHaveBeenCalledWith('OLD_REFRESH');
      expect(authService.setAuthCookies).toHaveBeenCalledWith(response, mockTokens);
      expect(result).toEqual({ user: mockUser });
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      const request = mockRequest({});
      const response = mockResponse();

      await expect(controller.refresh(request as any, response as any)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.refresh(request as any, response as any)).rejects.toThrow(
        'Refresh token missing',
      );
    });
  });

  describe('logout', () => {
    it('should logout, clear cookies, and return ok', async () => {
      const request = mockRequest({ refresh_token: 'REFRESH_TOKEN' });
      const response = mockResponse();

      const result = await controller.logout(request as any, response as any);

      expect(authService.logout).toHaveBeenCalledWith('REFRESH_TOKEN');
      expect(authService.clearAuthCookies).toHaveBeenCalledWith(response);
      expect(result).toEqual({ ok: true });
    });

    it('should logout even when refresh token is missing', async () => {
      const request = mockRequest({});
      const response = mockResponse();

      const result = await controller.logout(request as any, response as any);

      expect(authService.logout).toHaveBeenCalledWith(undefined);
      expect(authService.clearAuthCookies).toHaveBeenCalledWith(response);
      expect(result).toEqual({ ok: true });
    });
  });
});
