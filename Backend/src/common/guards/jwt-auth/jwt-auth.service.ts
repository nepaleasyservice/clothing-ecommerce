import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { PROTECT_KEY } from '../../decorators/auth/auth.decorator';

// JWT AUTH GUARDS
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {

    const shouldProtect = this.reflector.getAllAndOverride<boolean>(PROTECT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if(!shouldProtect) return true;

    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('Missing access token');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      // console.log(payload);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer') return token;
    }
    return (req as any).cookies?.accessToken ?? null;
  }
}
