import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { METADATA } from 'src/common/constants/metadata/metadata.constant';
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

  @Get('crawling')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async crawling(): Promise<boolean> {
    console.log('crawl');
    return await this.articleService.dataCrawling();
  }

  @Get('topic')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getTopic(): Promise<boolean> {
    return await this.articleService.crawlTopic();
  }

  @Get('content')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  async getDataContent(): Promise<boolean> {
    return await this.articleService.getDataContent();
  }
}
