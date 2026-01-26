import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';
import { UserRoles } from '../../common/enums/users.enum';

export class CreateUserDto {
  @IsString()
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 0,
    minUppercase: 1,
    minSymbols: 1,
  })
  password: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRoles, { each: true })
  roles: UserRoles[];
}
