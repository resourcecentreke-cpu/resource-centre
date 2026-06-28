import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Simple shared-key guard for the no-code /admin page (header: x-manage-key). */
@Injectable()
export class ManageKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const key = this.config.get<string>('MANAGE_KEY');
    if (!key) throw new ForbiddenException('Admin management is not configured (set MANAGE_KEY)');
    const req = ctx.switchToHttp().getRequest();
    const provided = req.headers['x-manage-key'];
    if (provided !== key) throw new ForbiddenException('Invalid admin key');
    return true;
  }
}
