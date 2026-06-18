import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const email: string | undefined = req.user?.email;
    const allow = (this.config.get<string>('ADMIN_EMAILS', '') || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!email || !allow.includes(email.toLowerCase())) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
