import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { LocalAuthenticatedRequest } from './authenticatedRequest.type';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, tokens } = await this.authService.signup(dto);
    this.authService.setAuthCookies(response, tokens);
    return { user };
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Req() request: LocalAuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() _dto: LoginDto,
  ) {
    const { user, tokens } = await this.authService.login(request.user);
    this.authService.setAuthCookies(response, tokens);
    return { user };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const { user, tokens } = await this.authService.refresh(refreshToken);
    this.authService.setAuthCookies(response, tokens);
    return { user };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;
    await this.authService.logout(refreshToken);
    this.authService.clearAuthCookies(response);
    return { ok: true };
  }
}
