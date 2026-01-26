import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { JwtProviderModule } from './jwt-provider/jwt-provider.module';

@Module({
  imports: [DatabaseModule, RedisModule,  JwtProviderModule],
  exports: [DatabaseModule, RedisModule, JwtProviderModule],
})
export class CoreModule {}
