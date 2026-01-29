import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FeaturesModule } from './features/features.module';
import IndexConfig from './config/index.config';
import { GuardModule } from './common/guards/guard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: IndexConfig,
    }),
    FeaturesModule,
    GuardModule,
  ],
})
export class AppModule {}
