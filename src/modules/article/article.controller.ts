import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { METADATA } from 'src/common/constants/metadata/metadata.constant';
import { getImg } from 'src/common/dto/pagination.dto';
import { ArticleService } from './article.service';
import { ArticleRequest } from './dto/articleRequest.dto';

@ApiTags('Articles')
@Controller('article')
@UseInterceptors(ClassSerializerInterceptor)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getList(@Query() articleRequest: ArticleRequest): Promise<any> {
    return await this.articleService.search(articleRequest);
  }

  @Post('saved')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getListSaved(
    @Query() articleRequest: ArticleRequest,
    @Body() articleIds: number[],
  ): Promise<any> {
    return await this.articleService.getSavedArticlesByDate(
      articleRequest,
      articleIds,
    );
  }

  @Get('articles')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getArticleByDate(
    @Query() articleRequest: ArticleRequest,
  ): Promise<any> {
    return await this.articleService.getArticlesByDate(articleRequest);
  }

  @Get('articles/:tag')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getArticleByDateAndTag(
    @Query() articleRequest: ArticleRequest,
    @Param('tag', ParseIntPipe) tagId: number,
  ): Promise<any> {
    return await this.articleService.getArticlesByDateAndTag(
      articleRequest,
      tagId,
    );
  }

  @Get('tags')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getTags(@Query() articleRequest: ArticleRequest): Promise<any> {
    return await this.articleService.getTags(articleRequest);
  }

  @Get('tags/:id')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getTagData(@Param('id', ParseIntPipe) tagId: number): Promise<any> {
    return await this.articleService.getTagData(tagId);
  }

  @Get('new-post-crawl')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async newPostCrawl(): Promise<boolean> {
    return await this.articleService.crawl10ArticlePerTopic();
  }

  @Get('crawling')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async crawling(): Promise<boolean> {
    return await this.articleService.dataCrawling();
  }

  @Get('topic')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getTopic(): Promise<boolean> {
    return await this.articleService.crawlTopic();
  }

  @Get('content')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getDataContent(@Query() getRequest: getImg): Promise<boolean> {
    return await this.articleService.getDataContent(getRequest);
  }

  @Get('contentImg')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getDataContentWithImg(): Promise<boolean> {
    return await this.articleService.getDataContentWithImg();
  }

  @Get('clean-data')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async cleanData(): Promise<boolean> {
    return await this.articleService.cleanArticles();
  }

  @Get('send-data')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async sendData(): Promise<boolean> {
    return await this.articleService.crawlSchedule();
  }
}
