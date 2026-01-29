import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RoleGuard } from './role/role.guard';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Role} from "../../database/entities/role.entity";
import { Permission } from '../../database/entities/permission.entity';
import { PermissionGuard } from './permission/permission.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.accessTokenSecret'),
      }),
    }),
      TypeOrmModule.forFeature([Role, Permission]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
    {provide: APP_GUARD, useClass: PermissionGuard}
  ],
  exports: [JwtModule],
})
export class GuardModule {}