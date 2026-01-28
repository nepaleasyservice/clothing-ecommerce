import {
  Column,
  CreateDateColumn,
  Entity, JoinTable, ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { IsString } from 'class-validator';
import { authProviders } from '../../common/enums/authproviders.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class AuthProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.authProvider, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: authProviders,
  })
  @IsString()
  provider: authProviders;

  @Column()
  providerUserId: string;

  @ApiProperty({
    description: 'is user email verified',
    examples: [true, false],
  })
  @Column({ type: Boolean, default: false })
  emailVerified: boolean;

  @Column()
  refresh_token: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}