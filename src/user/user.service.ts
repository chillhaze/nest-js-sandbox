import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { CreateUserDto } from './dto/CreateUser.dto';
import { sign } from 'jsonwebtoken';
import { JWT_SECRET } from '@app/config';
import { IUserResponse } from './types/userResponse.interface';
import { LoginUserDto } from './dto/LoginUserDto';
import { compare } from 'bcrypt';
import { UpdateCurrentUserDto } from './dto/UpdateCurrentUser.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const userByEmail = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    const userByName = await this.userRepository.findOne({
      where: { name: dto.name },
    });

    if (userByEmail || userByName) {
      throw new HttpException(
        `Email or Name are taken`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newUser = new UserEntity();
    Object.assign(newUser, dto);
    return await this.userRepository.save(newUser);
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
  }

  async updateUser(
    userId: number,
    dto: UpdateCurrentUserDto,
  ): Promise<UserEntity> {
    const user = await this.findById(userId);
    if (!user) {
      throw new HttpException(
        `User with id:${userId} not found`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const allowedFieldsToUpdate = ['name', 'email', 'password', 'bio', 'image'];
    const unknownProperties = Object.keys(dto).filter(
      (key) => !allowedFieldsToUpdate.includes(key),
    );

    if (unknownProperties.length > 0) {
      const unknownPropertiesString = unknownProperties.reduce((acc, next) => {
        if (acc.length) {
          return (acc += ` & ${next}`);
        }
        return (acc += next);
      }, '');

      throw new HttpException(
        `${unknownPropertiesString} ${
          unknownProperties.length > 1
            ? 'fields are not allowed to update'
            : 'field is not allowed to update'
        }`,
        HttpStatus.FORBIDDEN,
      );
    } else {
      if (dto.password) {
        dto.password = await hash(dto.password, 10);
      }

      await this.userRepository.update(user.id, dto);

      const updatedUser = await this.userRepository.findOne({
        where: { id: user.id },
      });

      return updatedUser;
    }
  }

  async loginUser(dto: LoginUserDto): Promise<UserEntity> {
    const userByEmail = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'name', 'bio', 'email', 'image', 'password'],
    });

    if (!userByEmail) {
      throw new HttpException(
        `Credentials are not valid`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isPasswordVerified = await compare(
      dto.password,
      userByEmail.password,
    );

    if (!isPasswordVerified) {
      throw new HttpException(`Password not valid`, HttpStatus.UNAUTHORIZED);
    }

    delete userByEmail.password;
    return userByEmail;
  }

  generateJwt(user: UserEntity): string {
    return sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
    );
  }

  buildUserResponse(user: UserEntity): IUserResponse {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      },
    };
  }
}
