import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateCurrentUserDto {
  @IsOptional()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsEmail()
  readonly email: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  readonly bio: string;

  @IsOptional()
  @IsString()
  readonly image: string;
}
