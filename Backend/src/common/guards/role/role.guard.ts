import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/auth/auth.decorator';
import { Request } from 'express';
import { AuthUser } from '../../../features/auth/interface/auth.user.interface';
import {InjectRepository} from "@nestjs/typeorm";
import { Role } from '../../../database/entities/role.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, @InjectRepository(Role) private readonly roleRepo: Repository<Role>) {
  }
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    console.log("Inside role");

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if(!requiredRoles || requiredRoles.length === 0) return true;

    const req: Request = context.switchToHttp().getRequest();

    const user: AuthUser | undefined = req.user;

    if (user === undefined) return false;

    const userRoles: string[] = user?.roles??[];

    return requiredRoles.some((r) => userRoles.includes(r));
  }
}
