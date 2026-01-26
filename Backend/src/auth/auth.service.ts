import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthServiceContract } from './contracts/auth.service.contract';
import {
  generateCodeVerifier,
  generateState,
  Google,
  OAuth2Tokens,
} from 'arctic';
import { randomUUID, webcrypto } from 'node:crypto';
import { createClient } from 'redis';
import { GOOGLE_OAUTH } from './oauth/google.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { decodeJwt } from 'jose';
import { UserRoles } from '../common/enums/users.enum';
import { GoogleClaims } from './interface/google.claims';
import { Repository } from 'typeorm';
import { Role } from '../database/entities/role.entity';
import { AuthProvider } from '../database/entities/auth.providers.entity';
import { authProviders } from '../common/enums/authproviders.enum';
import * as bcrypt from 'bcrypt';
import { JwtProvider } from '../core/jwt-provider/jwt-provider.service';

type ClientRedis = ReturnType<typeof createClient>;

@Injectable()
class AuthService extends AuthServiceContract {
  constructor(
    private readonly jwtProvider: JwtProvider,
    @InjectRepository(AuthProvider)
    private readonly authProviderRepo: Repository<AuthProvider>,
    @Inject('REDIS_CLIENT') private readonly redis: ClientRedis,
    @Inject(GOOGLE_OAUTH) private readonly google: Google,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {
    super();
  }

  private generate32ByteHex(): string {
    return Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString(
      'hex',
    );
  }

  async generateGoogleLoginPageUrl(): Promise<string | null> {
    try {
      const oauthSessionId = this.generate32ByteHex();
      const codeVerifier = generateCodeVerifier();

      const state = JSON.stringify({
        sessionId: oauthSessionId,
        csrf: generateState(),
      });
      // console.log(state, codeVerifier);

      const scopes = ['openid', 'email', 'profile'];

      const url = this.google.createAuthorizationURL(
        state,
        codeVerifier,
        scopes,
      );

      await this.redis.hSet(`session:${oauthSessionId}`, {
        state,
        codeVerifier,
        provider: 'GOOGLE',
      });
      await this.redis.expire(`session:${oauthSessionId}`, 600);
      // console.log({ oauthSessionId: oauthSessionId });
      return url.toString();
    } catch (err) {
      console.log('OAuth init failed', err);
      return null;
    }
  }

  async handleGoogleCallback(
    state: string,
    code: string,
  ): Promise<OAuth2Tokens> {
    // console.log('hello1');
    const decordedState = JSON.parse(state);
    // console.log('hello2');
    // console.log(code);
    // console.log('hello3');

    const sessionId = decordedState.sessionId;
    const redisKey = `session:${sessionId}`;

    const existingSession = await this.redis.hGetAll(redisKey);

    if (!existingSession || !existingSession.codeVerifier)
      throw new UnauthorizedException('Invalid or expired OAuth session');

    await this.redis.del(redisKey);

    const tokens = await this.google.validateAuthorizationCode(
      code,
      existingSession.codeVerifier,
    );

    return tokens;
  }

  async loginWithGoogle(
    tokens: OAuth2Tokens,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const idToken = tokens.idToken();
    if (!idToken) {
      throw new UnauthorizedException('Invalid or expired OAuth token');
    }

    const claims = decodeJwt<GoogleClaims>(idToken);

    let provider = await this.authProviderRepo.findOne({
      where: {
        provider: authProviders.GOOGLE,
        providerUserId: claims.sub,
      },
      relations: ['user'],
    });

    let user: User | null;

    if (provider) {
      user = provider.user;
    } else {
      user = await this.userRepo.findOne({
        where: { email: claims.email },
        relations: ['roles'],
      });

      if (user) {
        provider = this.authProviderRepo.create({
          provider: authProviders.GOOGLE,
          providerUserId: claims.sub,
          user,
        });
        await this.authProviderRepo.save(provider);
      }
      else {
        const userRole = await this.roleRepo.findOneBy({
          name: UserRoles.CUSTOMER,
        });
        if (!userRole) throw new Error('USER role not found');

        user = this.userRepo.create({
          name: claims.name,
          email: claims.email,
          emailVerified: claims.email_verified === true,
          roles: [userRole],
        });
        await this.userRepo.save(user);

        provider = this.authProviderRepo.create({
          provider: authProviders.GOOGLE,
          providerUserId: claims.sub,
          user,
        });
        await this.authProviderRepo.save(provider);
      }
    }
    if (!user) {
      throw new InternalServerErrorException(
        'Auth invariant broken: user not resolved',
      );
    }

    const accessToken = await this.jwtProvider.getAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
    });

    const refreshToken = randomUUID();
    await this.redis.set(`refresh:${refreshToken}`, user.id, {
      EX: 7 * 24 * 60 * 60,
    });

    return { accessToken, refreshToken };
  }

  login(username: string, password: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  signup(
    username: string,
    password: string,
    confirmPassword: string,
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}

export default AuthService;
