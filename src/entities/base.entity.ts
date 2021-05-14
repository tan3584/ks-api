import {
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @UpdateDateColumn()
  updatedDate: Date;

  @CreateDateColumn()
  createdDate: Date;
}
