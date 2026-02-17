import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { SignupDto } from './dto/signup.dto';
import { RefreshToken } from './refresh-token.entity';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly accessTtlMs = 5 * 60 * 1000;
  private readonly refreshTtlMs = 7 * 24 * 60 * 60 * 1000;
  private readonly refreshTokenSaltRounds = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepo: Repository<RefreshToken>,
  ) {}

  async signup(dto: SignupDto): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      role: UserRole.CUSTOMER,
    });

    const tokens = await this.issueTokens(user);
    return { user: this.toSafeUser(user), tokens };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return user;
  }

  async login(user: User): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const tokens = await this.issueTokens(user);
    return { user: this.toSafeUser(user), tokens };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const activeToken = await this.findActiveRefreshToken(payload.userId, refreshToken);

    if (!activeToken) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    activeToken.revokedAt = new Date();
    await this.refreshTokensRepo.save(activeToken);

    const user = await this.usersService.findOne(payload.userId);
    const tokens = await this.issueTokens(user);

    return { user: this.toSafeUser(user), tokens };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const activeToken = await this.findActiveRefreshToken(payload.userId, refreshToken);
      if (activeToken) {
        activeToken.revokedAt = new Date();
        await this.refreshTokensRepo.save(activeToken);
      }
    } catch {
      // Best-effort logout: ignore invalid/expired tokens.
    }
  }

  setAuthCookies(response: Response, tokens: AuthTokens): void {
    const cookieOptions = this.getCookieOptions();

    response.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: this.accessTtlMs,
    });
    response.cookie('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: this.refreshTtlMs,
    });
  }

  clearAuthCookies(response: Response): void {
    const cookieOptions = this.getCookieOptions();
    response.clearCookie('access_token', cookieOptions);
    response.clearCookie('refresh_token', cookieOptions);
  }

  private getCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'none' as const,
      secure: this.config.get<string>('COOKIE_SECURE') !== 'false',
      path: '/',
    };
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { userId: user.id, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.getAccessSecret(),
      expiresIn: '5m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: '7d',
    });

    await this.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = await bcrypt.hash(refreshToken, this.refreshTokenSaltRounds);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    const record = this.refreshTokensRepo.create({
      userId,
      tokenHash,
      expiresAt,
    });

    await this.refreshTokensRepo.save(record);
  }

  private async findActiveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<RefreshToken | null> {
    const now = new Date();
    const activeTokens = await this.refreshTokensRepo.find({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });

    for (const token of activeTokens) {
      const matches = await bcrypt.compare(refreshToken, token.tokenHash);
      if (matches) return token;
    }

    return null;
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private getAccessSecret(): string {
    return this.config.get<string>('JWT_ACCESS_SECRET') ?? 'access-secret';
  }

  private getRefreshSecret(): string {
    return this.config.get<string>('JWT_REFRESH_SECRET') ?? 'refresh-secret';
  }

  private toSafeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
