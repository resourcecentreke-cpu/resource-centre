import {
  BadRequestException, ConflictException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { toAuthUser } from './auth.util';
import { NotificationsService } from '../notifications/notifications.service';
import { buildVerificationMessage } from '../notifications/notifications.templates';
import type { AuthResponse, AuthTokens, AuthUser, JwtPayload } from '@rc/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, phone: dto.phone ?? null, passwordHash },
    });
    const tokens = await this.issueTokens(user.id, user.email);
    void this.sendVerification(user.id, user.email, user.locale);
    return { user: toAuthUser(user), tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const tokens = await this.issueTokens(user.id, user.email);
    return { user: toAuthUser(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.hashedRefreshToken) throw new UnauthorizedException('Session expired');
    const matches = await argon2.verify(user.hashedRefreshToken, refreshToken);
    if (!matches) throw new UnauthorizedException('Refresh token revoked');
    return this.issueTokens(user.id, user.email); // rotates
  }

  async logout(userId: string): Promise<{ success: true }> {
    await this.prisma.user.update({ where: { id: userId }, data: { hashedRefreshToken: null } });
    return { success: true };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return toAuthUser(user);
  }

  async sendVerification(sub: string, email: string, locale: string): Promise<void> {
    const token = await this.jwt.signAsync(
      { sub, email, purpose: 'verify' },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: '1d' },
    );
    const site = this.config.get<string>('SITE_URL', 'http://localhost:3000');
    const message = buildVerificationMessage({
      url: `${site}/#/verify?token=${token}`,
      lang: locale === 'sw' ? 'sw' : 'en',
    });
    await this.notifications.dispatch(['email'], { email }, message);
  }

  async verifyEmail(token: string): Promise<{ verified: true }> {
    let payload: { sub: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired verification link');
    }
    if (payload.purpose !== 'verify') throw new BadRequestException('Invalid verification token');
    await this.prisma.user.update({ where: { id: payload.sub }, data: { isVerified: true } });
    return { verified: true };
  }

  private async issueTokens(sub: string, email: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub, email };
    const expiresIn = Number(this.config.get('JWT_ACCESS_TTL', 900));
    const refreshTtl = Number(this.config.get('JWT_REFRESH_TTL', 1209600));
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl,
      }),
    ]);
    await this.prisma.user.update({
      where: { id: sub },
      data: { hashedRefreshToken: await argon2.hash(refreshToken) },
    });
    return { accessToken, refreshToken, expiresIn };
  }
}
