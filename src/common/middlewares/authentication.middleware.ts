import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthenticateMiddleware implements NestMiddleware {
  constructor() {}
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // const tokenString = getTokenFromRequest(req);

    // if (!tokenString) return next();
    // const token = await this.tokenHelper.verifyToken(tokenString);

    // (req as any).user = token;

    next();
  }
}
