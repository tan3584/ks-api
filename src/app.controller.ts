import { Controller, Get, SetMetadata } from '@nestjs/common';
import { AppService } from './app.service';
import { METADATA } from './common/constants/metadata/metadata.constant';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SetMetadata(METADATA.IS_PUBLIC, true)
  getHello(): Promise<string> {
    return this.appService.getHello();
  }

  @Get('123')
  @SetMetadata(METADATA.IS_PUBLIC, true)
  getHello12(): Promise<string> {
    return this.appService.getHello();
  }
}
