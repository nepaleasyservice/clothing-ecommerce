import { Module } from '@nestjs/common';
import {AuthModule} from "./auth/auth.module";
import {UserModule} from "./user/user.module";

@Module({
  imports: [ UserModule, AuthModule],
  exports: [ UserModule, AuthModule],
})
export class FeaturesModule {}
