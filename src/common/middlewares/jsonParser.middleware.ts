import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';

@Injectable()
export class JsonParserMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    bodyParser.json()(req, res, next);
  }
}
