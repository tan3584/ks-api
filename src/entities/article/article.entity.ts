import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Tag } from '../tag/tag.entity';

@Entity()
export class Article extends BaseEntity {
  @Column({
    nullable: true,
  })
  title: string;

  @Column({
    nullable: true,
  })
  link: string;

  @Column({
    nullable: true,
  })
  content: string;

  @Column({
    nullable: true,
  })
  author: string;

  @Column({
    nullable: true,
  })
  imgUrl: string;

  @Column({
    nullable: true,
  })
  date: string;

  @ManyToOne(
    () => Tag,
    tag => tag.articles,
  )
  tag: Tag;

  @Column({
    default: false,
  })
  processed: boolean;

  @Column({ nullable: true })
  processedDate: Date;

  @Column({ nullable: true })
  thumpImg: string;
}
