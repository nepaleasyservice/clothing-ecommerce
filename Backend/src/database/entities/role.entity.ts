import {
  Column,
  CreateDateColumn,
  Entity, JoinTable, ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Permission, {eager: true})
  @JoinTable({name: 'role_permissions'})
  permissions: Permission[];
}