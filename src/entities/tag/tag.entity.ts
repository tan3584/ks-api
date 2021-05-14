import { Column, Entity, OneToMany } from 'typeorm';
import { Article } from '../article/article.entity';
import { BaseEntity } from '../base.entity';

@Entity()
export class Tag extends BaseEntity {
  @Column({
    nullable: true,
  })
  title: string;

  @Column({
    nullable: true,
  })
  url: string;

  @Column({
    nullable: true,
  })
  total: number;

  @Column({
    nullable: true,
  })
  totalPage: number;

  @OneToMany(
    () => Article,
    article => article.tag,
  )
  articles: Article[];
}
