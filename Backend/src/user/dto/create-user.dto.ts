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
import { ApiProperty } from '@nestjs/swagger';


export class CreateUserDto {
  @ApiProperty({
    description: "The user's name",
    example: "Rohan Dhungana",
  })
  @IsString()
  @MaxLength(20)
  username: string;

  @ApiProperty({
    description: "The user's email",
    example: "rohandhungana2002@gmail.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "The user's password. Should consist at least 1 uppercase, 1 special character, and should be legth of 8",
    example: "Rohan123@456"
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 0,
    minUppercase: 1,
    minSymbols: 1,
  })
  password: string;

  @ApiProperty({
    description: "The user's role",
    example: ['ADMIN', 'SUPERADMIN', 'USER']
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRoles, { each: true })
  roles: UserRoles[];
}
