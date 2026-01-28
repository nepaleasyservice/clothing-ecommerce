import {
  BadRequestException,
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
import { createHash, randomBytes, webcrypto } from 'node:crypto';
import { createClient } from 'redis';
import { GOOGLE_OAUTH } from './oauthProviders/google.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { decodeJwt } from 'jose';
import { UserRoles } from '../../common/enums/users.enum';
import { GoogleClaims } from './interface/google.claims';
import { Repository } from 'typeorm';
import { Role } from '../../database/entities/role.entity';
import { AuthProvider } from '../../database/entities/auth.providers.entity';
import { authProviders } from '../../common/enums/authproviders.enum';
import { JwtProvider } from '../../core/jwt-provider/jwt-provider.service';
import * as bcrypt from 'bcrypt';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { StateDto } from './dto/state.dto';
import { CryptoService } from '../../core/crypto/crypto.service';
import { SessionData } from './interface/session-data.interface';
import { User } from '../../database/entities/user.entity';

type ClientRedis = ReturnType<typeof createClient>;

@Injectable()
class AuthService extends AuthServiceContract {
  constructor(
    private readonly jwtProvider: JwtProvider,
    private readonly cryptoService: CryptoService,
    @Inject('REDIS_CLIENT') private readonly redis: ClientRedis,
    @Inject(GOOGLE_OAUTH) private readonly google: Google,
    @InjectRepository(AuthProvider)
    private readonly authProviderRepo: Repository<AuthProvider>,
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

  private makeRefreshToken() {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
  }

  async generateGoogleLoginPageUrl(): Promise<string | null> {
    try {
      const oauthSessionId = this.generate32ByteHex();
      const codeVerifier = generateCodeVerifier();

      const state = JSON.stringify({
        sessionId: oauthSessionId,
        csrf: generateState(),
      });

      const scopes = ['openid', 'email', 'profile'];

      const url = this.google.createAuthorizationURL(
        state,
        codeVerifier,
        scopes,
      );
      // url.searchParams.set('access_type', 'offline');

      await this.redis.hSet(`session:${oauthSessionId}`, {
        state,
        codeVerifier,
        provider: 'GOOGLE',
      });
      await this.redis.expire(`session:${oauthSessionId}`, 600);
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
    let decodedState: StateDto;
    try {
      decodedState = <StateDto>JSON.parse(state);
    } catch {
      throw new UnauthorizedException('Invalid state');
    }

    const sessionId = decodedState.sessionId;
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

    // console.log({ idToken: tokens, claims: claims });

    let provider = await this.authProviderRepo.findOne({
      where: {
        provider: authProviders.GOOGLE,
        providerUserId: claims.sub,
      },
      relations: ['user', 'user.roles'],
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
      } else {
        const userRole = await this.roleRepo.findOneBy({
          name: UserRoles.CUSTOMER,
        });
        if (!userRole) throw new Error('USER role not found');

        const queryRunner =
          this.userRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          user = this.userRepo.create({
            name: claims.name,
            email: claims.email,
            roles: [userRole],
          });
          await queryRunner.manager.save(user);

          provider = this.authProviderRepo.create({
            provider: authProviders.GOOGLE,
            providerUserId: claims.sub,
            user,
          });
          await queryRunner.manager.save(provider);

          await queryRunner.commitTransaction();
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
        // console.log(tokens);
        await this.authProviderRepo.save(provider);
      }
    }
    if (tokens.hasRefreshToken()) {
      provider.refresh_token = this.cryptoService.encrypt(
        tokens.refreshToken(),
      );
      await this.authProviderRepo.save(provider);
    }
    if (!user) {
      throw new InternalServerErrorException(
        'Auth invariant broken: user not resolved',
      );
    }

    const accessToken = await this.jwtProvider.getAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
    });

    const userSessionsKey = `user_sessions:${user.id}`;
    const tokenExists = await this.redis.sMembers(userSessionsKey);

    if (tokenExists.length > 0) {
      const existedToken = await this.redis.get(`refresh:${tokenExists[0]}`);
      if (!existedToken) throw new UnauthorizedException('user not found');
      // console.log(`Redis refresh token: ${existedToken}`);
      return { accessToken, refreshToken: existedToken };
    }

    const { token, tokenHash } = this.makeRefreshToken();
    await this.redis.set(
      `refresh:${tokenHash}`,
      JSON.stringify({ userId: user.id }),
      {
        EX: 7 * 24 * 60 * 60,
      },
    );
    await this.redis.sAdd(userSessionsKey, tokenHash);
    await this.redis.expire(userSessionsKey, 7 * 24 * 60 * 60);

    return { accessToken, refreshToken: token };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: any; refreshToken: any }> {
    const oldHash = createHash('sha256').update(refreshToken).digest('hex');
    const oldKey = `refresh:${oldHash}`;

    const data = await this.redis.get(oldKey);
    if (!data) throw new UnauthorizedException('Invalid refresh token');

    const sessionData: SessionData = JSON.parse(data);

    await this.redis.del(oldKey);

    const userSessionsKey = `user_sessions:${sessionData.userId}`;
    await this.redis.sRem(userSessionsKey, oldHash);

    const user = await this.userRepo.findOne({
      where: { id: sessionData.userId },
      relations: ['roles'],
    });

    if (!user) throw new UnauthorizedException();

    const accessToken = await this.jwtProvider.getAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
    });

    const { token, tokenHash } = this.makeRefreshToken();

    await this.redis.set(
      `refresh:${tokenHash}`,
      JSON.stringify({ userId: user.id }),
      {
        EX: 7 * 24 * 60 * 60,
      },
    );

    await this.redis.sAdd(userSessionsKey, tokenHash);
    await this.redis.expire(userSessionsKey, 7 * 24 * 60 * 60);

    return { accessToken, refreshToken: token };
  }

  async login(
    data: UserLoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = data;

    const attemptsKey = `login_attempts:${email}`;
    const attempts = await this.redis.get(attemptsKey);
    if (parseInt(attempts || '0') > 5) {
      throw new UnauthorizedException('Too many attempts. Try again later.');
    }

    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['roles'],
      select: [
        'id',
        'email',
        'password',
        'isActive',
        'name',
        'roles',
      ],
    });
    if (!user) throw new UnauthorizedException('invalid credentials');

    const authProvider = await this.authProviderRepo.findOne({
      where: { user: user, provider: authProviders.LOCAL },
      relations: ['user'],
    });

    const validPassword = user
      ? await bcrypt.compare(password, user.password)
      : false;

    const canLogin = user && validPassword && user.isActive && authProvider && authProvider.emailVerified;

    if (!canLogin) {
      await this.redis.incr(attemptsKey);
      await this.redis.expire(attemptsKey, 900);

      throw new UnauthorizedException('Invalid credentials or account issues');
    }

    await this.redis.del(attemptsKey);

    const payload = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
    };
    const accessToken = await this.jwtProvider.getAccessToken(payload);

    const { token, tokenHash } = this.makeRefreshToken();
    const sessionInfo: SessionData = {
      userId: user.id,
    };
    await this.redis.set(`refresh:${tokenHash}`, JSON.stringify(sessionInfo), {
      EX: 7 * 24 * 60 * 60,
    });

    const userSessionsKey = `user_sessions:${user.id}`;
    await this.redis.sAdd(userSessionsKey, tokenHash);
    await this.redis.expire(userSessionsKey, 7 * 24 * 60 * 60);

    return { accessToken, refreshToken: token };
  }

  async signup(body: UserRegisterDto): Promise<User> {
    const { firstName, lastName, email, password, confirmPassword } = body;
    if (password !== confirmPassword)
      throw new BadRequestException('Password mismatch');

    const queryRunner = this.userRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let user = await queryRunner.manager.findOne(User, {
        where: { email },
        lock: { mode: 'pessimistic_write' },
      });


      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (user) {
        const existingProvider = await queryRunner.manager.findOne(
          AuthProvider,
          {
            where: {
              user: { id: user.id },
              provider: authProviders.LOCAL,
            },
          },
        );
        if (existingProvider)
          throw new BadRequestException('user already exists');

        const provider = queryRunner.manager.create(AuthProvider, {
          provider: authProviders.LOCAL,
          providerUserId: email,
          user,
        });
        await queryRunner.manager.save(provider);
        await queryRunner.commitTransaction();

        user.password = hashedPassword;
        await queryRunner.manager.save(user);
        return user;
      }

      const role = await queryRunner.manager.findOne(Role, {
        where: { name: UserRoles.CUSTOMER },
      });

      if (!role) throw new InternalServerErrorException('Role not found');

      user = queryRunner.manager.create(User, {
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        roles: [role],
      });
      await queryRunner.manager.save(user);

      const provider = queryRunner.manager.create(AuthProvider, {
        provider: authProviders.LOCAL,
        providerUserId: email,
        user,
      });
      await queryRunner.manager.save(provider);
      await queryRunner.commitTransaction();

      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Register failed');
    } finally {
      await queryRunner.release();
    }
  }
}

export default AuthService;
