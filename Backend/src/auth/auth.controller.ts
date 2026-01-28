import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query, Req,
  Res, UnauthorizedException,
} from '@nestjs/common';
import { AuthServiceContract } from './contracts/auth.service.contract';
import { OAuth2Tokens } from 'arctic';
import type { Response } from 'express';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '../config/cookie.config';
import { UserRegisterDto } from './dto/user-register.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger';
import {User} from "../database/entities/user.entity";
import {UserLoginDto} from "./dto/user-login.dto";
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthServiceContract) {}

  // google login signup and logout
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

    const tokens: OAuth2Tokens = await this.auth.handleGoogleCallback(
      state,
      code,
    );

    const { accessToken, refreshToken } = await this.auth.loginWithGoogle(tokens);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions());

    return { success: true, data: {accessToken } };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {

    const oldRefreshToken: string = req.cookies?.refreshToken;

    if (!oldRefreshToken)
      throw new UnauthorizedException('Missing refresh token');

    const { accessToken, refreshToken } = await this.auth.refresh(oldRefreshToken);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions());

    return { success: true };
  }



  // local login, signup and logout
  @ApiBadRequestResponse({
    description: 'please provide required credentials',
  })
  @Post('login')
  async login(@Body() body: UserLoginDto, @Res({passthrough: true}) res: Response) {
    const { accessToken, refreshToken } = await this.auth.login(body);

    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions());
    res.cookie('accessToken', accessToken, accessTokenCookieOptions());

    return {success: true };
  }

  @ApiBadRequestResponse({
    description: 'please provide a required credentials'
  })
  @Post('register')
  async localRegister(
    @Body() body: UserRegisterDto
  ) {
    const data: User = await this.auth.signup(body);
    return data;
  }
}
