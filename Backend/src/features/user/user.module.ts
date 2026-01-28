import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserServiceContract } from './contracts/user.service.contract';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';
import { JwtAuthModule } from '../../common/guards/jwt-auth/jwt-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission]), JwtAuthModule],
  providers: [
    {
      provide: UserServiceContract,
      useClass: UserService,
    },
  ],
  controllers: [UserController],
  exports: [UserServiceContract],
})
export class UserModule {}
