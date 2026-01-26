import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import IndexConfig from './config/index.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: IndexConfig,
    }),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
