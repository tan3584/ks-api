import {
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
  Post,
  SetMetadata,
  Req,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { METADATA } from 'src/common/constants/metadata/metadata.constant';
import { LogService } from './log.service';
import { Request } from 'express';

@ApiTags('CustomLog')
@Controller('log')
@UseInterceptors(ClassSerializerInterceptor)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @SetMetadata(METADATA.IS_PUBLIC, true)
  @Post()
  writelog(
    @Body() error: Record<string, any>,
    @Req() request: Request,
  ): Promise<number> {
    return this.logService.writeExceptionLog(error, (request as any).user);
  }
}
