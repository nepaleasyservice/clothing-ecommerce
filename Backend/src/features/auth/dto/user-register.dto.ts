import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class UserRegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  @IsString()
  password: string;

  @IsString()
  confirmPassword: string;
}