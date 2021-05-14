import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationRequest } from 'src/common/dto/pagination.dto';

export class ArticleRequest extends PaginationRequest {
  @ApiPropertyOptional({ required: false })
  searchKeyword?: string;
}
