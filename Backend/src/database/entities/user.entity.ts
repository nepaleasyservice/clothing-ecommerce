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

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({length: 20})
  name: string;

  @Column({unique: true, nullable: true})
  email: string;

  @Column({nullable: true})
  password: string;

  @Column({type: Boolean, default: false})
  emailVerified: boolean;

  @ManyToMany(() => Role, {eager: true})
  @JoinTable({name: "user_roles"})
  roles: Role[];

  @OneToMany(() => AuthProvider,(authProvider) => authProvider.user, { cascade: true })
  authProvider: AuthProvider[];

  @Column({default: true})
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}