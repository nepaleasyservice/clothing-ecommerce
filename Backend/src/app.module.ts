import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FeaturesModule } from './features/features.module';
import IndexConfig from './config/index.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: IndexConfig,
    }),
    FeaturesModule
  ],
})
export class AppModule {}
