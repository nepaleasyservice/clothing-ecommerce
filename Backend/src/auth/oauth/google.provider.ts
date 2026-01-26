import { ConfigService } from '@nestjs/config';
import { Google } from 'arctic';

export const GOOGLE_OAUTH = 'GOOGLE_OAUTH';
export const GoogleOAuthProvider = {
  provide: GOOGLE_OAUTH,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new Google(
      config.getOrThrow<string>('google.clientId'),
      config.getOrThrow<string>('google.clientSecret'),
      config.getOrThrow<string>('google.redirectUri'),
    );
  }
}