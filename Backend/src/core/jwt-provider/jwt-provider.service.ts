import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}
  public async getAccessToken(
    payload: any,
    expiresInForAccess?: number | null,
    // expiresInForRefresh?: number | null,
  ): Promise<string> /*, refreshToken: string*/ {
    const at = await this.jwtService.signAsync(
      { ...payload },
      {
        secret: this.config.getOrThrow<string>('jwt.accessTokenSecret'),
        expiresIn: expiresInForAccess
          ? expiresInForAccess
          : this.config.getOrThrow<number>('jwt.accessTokenExpiry'),
      },
    );
    // this.jwtService.signAsync(
    //   { ...payload },
    //   {
    //     secret: this.config.getOrThrow<string>('jwt.refreshTokenSecret'),
    //     expiresIn: expiresInForRefresh
    //       ? expiresInForRefresh
    //       : this.config.getOrThrow<number>('jwt.refreshTokenExpiry'),
    //   },
    // ),
    return at;
  }
  public async getRefreshToken(
    payload: any,
    expiresInForRefresh?: number | null,
  ): Promise<string> {
    const rt = await this.jwtService.signAsync(
      { ...payload },
      {
        secret: this.config.getOrThrow<string>('jwt.refreshTokenSecret'),
        expiresIn: expiresInForRefresh
          ? expiresInForRefresh
          : this.config.getOrThrow<number>('jwt.refreshTokenExpiry'),
      },
    );
    return rt;
  }
}
