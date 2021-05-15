import { HttpModule, Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/entities/article/article.entity';
import { Tag } from 'src/entities/tag/tag.entity';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tag, Article]),
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
    }),
    HttpModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
