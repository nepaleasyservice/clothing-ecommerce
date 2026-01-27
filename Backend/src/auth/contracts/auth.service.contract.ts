import { OAuth2Tokens } from 'arctic';
import { UserRegisterDto } from '../dto/user-register.dto';
import {User} from "../../database/entities/user.entity";
import {UserLoginDto} from "../dto/user-login.dto";
import { Req } from '@nestjs/common';

export abstract class AuthServiceContract {
  abstract login(
    data: UserLoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  abstract signup(data: UserRegisterDto): Promise<User>;
  abstract generateGoogleLoginPageUrl(): Promise<string | null>;
  abstract handleGoogleCallback(
    state: string,
    code: string,
  ): Promise<OAuth2Tokens>;
  abstract loginWithGoogle(
    tokens: OAuth2Tokens,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  abstract refresh(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }>
}