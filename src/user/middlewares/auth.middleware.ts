import { JWT_SECRET } from '@app/config';
import { IExpressRequest } from '@app/types/expressRequest.interface';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { UserService } from '../user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: IExpressRequest, _res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;

      next();
      return;
    }

    const token = req.headers.authorization.split(' ')[1];

    try {
      const decodedToken = verify(token, JWT_SECRET);
      const user = await this.userService.findById(decodedToken.id);
      req.user = user;

      next();
    } catch (error) {
      req.user = null;

      next();
    }
  }
}
