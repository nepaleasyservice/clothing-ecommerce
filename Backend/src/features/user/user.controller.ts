import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserServiceContract } from './contracts/user.service.contract';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { User } from '../../database/entities/user.entity';
import {
  JwtProtect,
  PermissionProtect,
  RolesProtect,
} from '../../common/decorators/auth/auth.decorator';
import { RolesEnum } from '../../common/enums/role.enum';
import { PermissionEnum } from '../../common/enums/permission.enum';

@JwtProtect()
@RolesProtect(RolesEnum.CUSTOMER)
@PermissionProtect(PermissionEnum.ORDER_VIEW)
@Controller('users')
export class UserController {
  constructor(private readonly user: UserServiceContract) {}

  @Get()
  async getUsers() {
    const users = await this.user.findAll();
    if (users.length === 0) {
      return {
        message: 'Users not found',
        data: [],
      };
    }
    return {
      message: 'Users found successfully',
      data: users,
    };
  }

  @Get(':id')
  async getOne(@Param('id') id: number) {
    try {
      const user = await this.user.getOne(id);
      return {
        message: 'User found',
        data: user,
      };
    } catch ({ message }) {
      throw new NotFoundException(message);
    }
  }

  @Post('create')
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'User is not successfully',
  })
  @UseInterceptors(AnyFilesInterceptor())
  async createUser(@Body() body: CreateUserDto) {
    console.log(body);
    try {
      const saveUser = await this.user.create(body);
      return {
        message: 'User created successfully',
        data: saveUser,
      };
    } catch ({ message }) {
      throw new BadRequestException(message);
    }
  }

  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return await this.user.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.user.delete(id);
  }
}
