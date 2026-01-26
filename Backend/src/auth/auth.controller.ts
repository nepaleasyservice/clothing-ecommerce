import {
  Controller,
  Get,
  HttpCode,
  Query, Res,
  // UnauthorizedException,
} from '@nestjs/common';
import { AuthServiceContract } from './contracts/auth.service.contract';
import { OAuth2Tokens } from 'arctic';
import type { Response } from 'express';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '../config/cookie.config';
// import { AuthUser } from './interface/auth.user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthServiceContract) {}

  @Get('google')
  @HttpCode(201)
  // @UseInterceptors(AnyFilesInterceptor())
  async getGoogleLogin() {
    const url = await this.auth.generateGoogleLoginPageUrl();
    if(!url) return "Unable to craete url";
    return url
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query("state") state: string,
    @Res({passthrough: true}) res: Response
  ) {
    if (!code || !state) return "Unable to create code";
    // console.log(state, code);

    const tokens: OAuth2Tokens = await this.auth.handleGoogleCallback(
      state,
      code,
    );

    const { accessToken, refreshToken } = await this.auth.loginWithGoogle(tokens);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions());

    console.log({accessToken: accessToken, refreshToken: refreshToken });

    return { success: true, data: {accessToken, refreshToken } };
  }
}
