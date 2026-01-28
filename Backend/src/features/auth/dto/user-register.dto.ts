import { IsString, IsStrongPassword } from 'class-validator';

export class UserRegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsStrongPassword()
  @IsString()
  password: string;

  @IsString()
  confirmPassword: string;
}