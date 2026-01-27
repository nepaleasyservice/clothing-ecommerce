import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import AuthService from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { AuthServiceContract } from './contracts/auth.service.contract';
import { GoogleOAuthProvider } from './oauthProviders/google.provider';
import { Role } from '../database/entities/role.entity';
import { AuthProvider } from '../database/entities/auth.providers.entity';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, AuthProvider]), CoreModule],
  controllers: [AuthController],
  providers: [
    {
      provide: AuthServiceContract,
      useClass: AuthService,
    },
    GoogleOAuthProvider
  ],
  exports: [GoogleOAuthProvider]
})
export class AuthModule {}
