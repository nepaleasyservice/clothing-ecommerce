import { User } from '../../../database/entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

export abstract class UserServiceContract {
  abstract getOne(id: number): Promise<User | null>;
  abstract findAll(): Promise<User[]>;
  abstract create(user: CreateUserDto): Promise<User>;
  abstract update(id: number, data: UpdateUserDto): Promise<User>;
  abstract delete(id: number): Promise<void>;
}