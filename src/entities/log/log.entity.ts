import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: true,
  })
  general: string;

  @Column({
    nullable: true,
  })
  detail: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    nullable: true,
  })
  generatedBy: number;
}
