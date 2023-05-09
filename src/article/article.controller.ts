import {
  Body,
  Controller,
  Delete,
  Put,
  Get,
  Param,
  Query,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/CreateArticle.dto';
import { ArticleService } from './article.service';
import { IArticleResponse } from './types/articleResponse.interface';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserEntity } from '@app/user/user.entity';
import { User } from '@app/decorators/user.decorator';
import { ArticleEntity } from './article.entity';
import { DeleteResult } from 'typeorm';
import { UpdateArticleDto } from './dto/UpdateArticle.dto';
import { IPaginatedListResponse } from '@app/types/paginatedListResponce.interface';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async createArticle(
    @User() currentUser: UserEntity,
    @Body('article') dto: CreateArticleDto,
  ): Promise<IArticleResponse> {
    const article = await this.articleService.createArticle(currentUser, dto);
    return this.articleService.buildArticleResponse(article);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(): Promise<ArticleEntity[]> {
    return await this.articleService.findAll();
  }

  @Get('filtered')
  async getFiltered(
    @User('id') currentUserId: number,
    @Query() query: any,
  ): Promise<IPaginatedListResponse<ArticleEntity>> {
    return await this.articleService.getFiltered(currentUserId, query);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string): Promise<IArticleResponse> {
    const article = await this.articleService.findBySlug(slug);
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  async deleteBySlug(
    @User('id') currentUserId: number,
    @Param('slug') slug: string,
  ): Promise<DeleteResult> {
    return await this.articleService.deleteBySlug(currentUserId, slug);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async updateBySlug(
    @User('id') currentUserId: number,
    @Param('slug') slug: string,
    @Body('article') dto: UpdateArticleDto,
  ): Promise<IArticleResponse> {
    const article = await this.articleService.updateBySlug(
      currentUserId,
      slug,
      dto,
    );
    return this.articleService.buildArticleResponse(article);
  }
}
