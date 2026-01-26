import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { IsString } from 'class-validator';
import { authProviders } from '../../common/enums/authproviders.enum';

@Entity()
export class AuthProvider{
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.authProvider, {onDelete: 'CASCADE'})
  user: User;

  @Column({
    type: 'enum',
    enum: authProviders
  })
  @IsString()
  provider: authProviders;

  @Column()
  providerUserId: string

  @Column()
  refresh_token: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}