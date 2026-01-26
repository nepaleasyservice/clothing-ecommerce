import { OAuth2Tokens } from 'arctic';

export abstract class AuthServiceContract {
  abstract login(username: string, password: string): Promise<any>;
  abstract signup(
    username: string,
    password: string,
    confirmPassword: string,
  ): Promise<any>;
  abstract generateGoogleLoginPageUrl(): Promise<string | null>;
  abstract handleGoogleCallback(
    state: string,
    code: string,
  ): Promise<OAuth2Tokens>;
  abstract loginWithGoogle(
    tokens: OAuth2Tokens,
  ): Promise<{ accessToken: string; refreshToken: string }>;
}