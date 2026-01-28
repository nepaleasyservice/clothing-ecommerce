import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany, OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { AuthProvider } from './auth.providers.entity';
import { ApiProperty } from '@nestjs/swagger';
import { authProviders } from '../../common/enums/authproviders.enum';

@Entity()
export class User {
  @ApiProperty({
    description: "user's id",
    example: 1
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: "user's name",
    example: "Rohan Dhungana"
  })
  @Column({length: 20})
  name: string;

  @ApiProperty({
    description: "user's email",
    example: "rohandhungana2002@gmail.com"
  })
  @Column({unique: true})
  email: string;

  @ApiProperty({
    description: "user's password which is hashed",
  })
  @Column({nullable: true})
  password: string;

  @ApiProperty({
    description: "is user email verified",
    examples: [true, false]
  })
  @Column({type: Boolean, default: false})
  emailVerified: boolean;

  @ApiProperty({
    description: "user's roles",
    example: ['ADMIN', 'SUPERADMIN', 'USER']
  })
  @ManyToMany(() => Role, {eager: true})
  @JoinTable({name: "user_roles"})
  roles: Role[];

  @ApiProperty({
    description: "auth provider",
    example: [authProviders.GOOGLE, authProviders.GITHUB]
  })
  @OneToMany(() => AuthProvider,(authProvider) => authProvider.user, { cascade: true })
  authProvider: AuthProvider[];

  @ApiProperty({
    description: "user is active or not",
    examples: [true, false]
  })
  @Column({default: true})
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}