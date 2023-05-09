import { IExpressRequest } from '@app/types/expressRequest.interface';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data: any, ctx: ExecutionContext) => {
  // data - argument inside decorator, e.g. - id, then we return id field from user
  const request = ctx.switchToHttp().getRequest<IExpressRequest>();
  if (!request.user) {
    return null;
  }

  if (data) {
    return request.user[data];
  }

  return request.user;
});
