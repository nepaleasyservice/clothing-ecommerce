import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { JwtProviderModule } from './jwt-provider/jwt-provider.module';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [DatabaseModule, RedisModule,  JwtProviderModule, CryptoModule],
  exports: [DatabaseModule, RedisModule, JwtProviderModule, CryptoModule],
})
export class CoreModule {}
