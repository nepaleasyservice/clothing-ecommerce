import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtProvider } from './jwt-provider.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({})
    })
  ],
  providers: [JwtProvider],
  exports: [JwtProvider],
})
export class JwtProviderModule {}
