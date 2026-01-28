import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { In, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserServiceContract } from './contracts/user.service.contract';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../database/entities/role.entity';

@Injectable()
export class UserService extends UserServiceContract {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {
    super();
  }

  async getOne(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async create(body: CreateUserDto): Promise<User> {
    const { roles, ...rest } = body;
    const user = this.userRepo.create(rest);

    const roleEntities = await this.roleRepo.find({
      where: { name: In(roles) },
    })

    if (roleEntities.length !== roles.length) {
      throw new BadRequestException(`Roles with id ${roleEntities.length} not found`);
    }
    user.roles = roleEntities;
    return this.userRepo.save(user);
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findOneBy({id});
    if(!user) {
      throw new NotFoundException('User does not exist');
    }
    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async delete(id: number): Promise<void> {
    const result = await this.userRepo.delete(id);

    if(result.affected === 0) {
      throw new NotFoundException('User does not exist');
    }
  }
}