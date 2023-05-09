import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UserEntity } from './user.entity';
import { IUserResponse } from './types/userResponse.interface';
import { LoginUserDto } from './dto/LoginUserDto';
import { User } from '@app/decorators/user.decorator';
import { AuthGuard } from './guards/auth.guard';
import { UpdateCurrentUserDto } from './dto/UpdateCurrentUser.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('users')
  @UsePipes(new ValidationPipe())
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<IUserResponse> {
    const user = await this.userService.createUser(createUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Get('users')
  async findAll(): Promise<IUserResponse[]> {
    const users = await this.userService.findAll();
    return users.map((user) => this.userService.buildUserResponse(user));
  }

  @Post('user/login')
  @UsePipes(new ValidationPipe())
  async login(
    @Body('user') loginUserDto: LoginUserDto,
  ): Promise<IUserResponse> {
    const user = await this.userService.loginUser(loginUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Get('user')
  @UseGuards(AuthGuard)
  async getCurrentUser(
    // @Req() request: IExpressRequest,
    @User() user: UserEntity,
    // @User('id') currentUserId: UserEntity,
  ): Promise<IUserResponse> {
    // return this.userService.buildUserResponse(request.user);
    return this.userService.buildUserResponse(user);
  }

  @Put('user')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async updateCurrentUser(
    @User('id') currentUserId: number,
    @Body('userUpdateData') dto: UpdateCurrentUserDto,
  ): Promise<IUserResponse> {
    const updatedUser = await this.userService.updateUser(currentUserId, dto);
    return this.userService.buildUserResponse(updatedUser);
  }
}
