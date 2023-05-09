import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleEntity } from './article.entity';
import { CreateArticleDto } from './dto/CreateArticle.dto';
import { IArticleResponse } from './types/articleResponse.interface';
import { UserEntity } from '@app/user/user.entity';
import slugify from 'slugify';
import { UpdateArticleDto } from './dto/UpdateArticle.dto';
import { IPaginatedListResponse } from '@app/types/paginatedListResponce.interface';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createArticle(
    currentUser: UserEntity,
    dto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const articleByTitle = await this.articleRepository.findOne({
      where: {
        title: dto.title,
      },
    });

    if (articleByTitle) {
      throw new HttpException(
        `Article with title '${dto.title}' already exists`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newArticle = new ArticleEntity();
    Object.assign(newArticle, dto);

    if (!newArticle.tagList) {
      newArticle.tagList = [];
    }

    newArticle.author = currentUser;
    newArticle.slug = this.generateSlug(dto.title);

    return await this.articleRepository.save({
      ...newArticle,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findAll(): Promise<ArticleEntity[]> {
    return await this.articleRepository.find();
  }

  async getFiltered(
    currentUserId: number,
    query: any,
  ): Promise<IPaginatedListResponse<ArticleEntity>> {
    const queryBuilder = this.dataSource
      .getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    queryBuilder.orderBy('articles.createdAt', query.sortDirection || 'ASC');

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        where: {
          name: query.author,
        },
      });

      queryBuilder.andWhere('articles.authorId = :id', { id: author.id });
    }

    const articlesCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(articlesCount / query.countOnPage);

    if (query.countOnPage) {
      queryBuilder.limit(query.countOnPage);
    }

    if (query.currentPage && query.countOnPage) {
      queryBuilder.offset((query.currentPage - 1) * query.countOnPage);
    }

    const articles = await queryBuilder.getMany();

    return {
      totalCount: articlesCount,
      totalPages,
      currentPage: query.currentPage,
      countOnCurrentPage: articles.length,
      data: articles,
    };
  }

  async findBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne({
      where: {
        slug,
      },
    });
  }

  async deleteBySlug(
    currentUserId: number,
    slug: string,
  ): Promise<DeleteResult> {
    const article = await this.findBySlug(slug);

    if (!article) {
      throw new HttpException(
        `Article with slug '${slug}' not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (article.author.id !== currentUserId) {
      throw new HttpException(
        `You should be the author of this article to delete it`,
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.articleRepository.delete({ slug });
  }

  async updateBySlug(
    currentUserId: number,
    slug: string,
    dto: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);

    if (!article) {
      throw new HttpException(
        `Article with slug '${slug}' not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (article.author.id !== currentUserId) {
      throw new HttpException(
        `You should be the author of this article to delete it`,
        HttpStatus.FORBIDDEN,
      );
    }

    const allowedFieldsToUpdate = ['title', 'description', 'body'];
    await this.checkDtoFields<UpdateArticleDto>(dto, allowedFieldsToUpdate);

    await this.articleRepository.update(article.id, {
      ...dto,
      slug: this.generateSlug(dto.title),
    });

    return await this.articleRepository.findOne({
      where: {
        id: article.id,
      },
    });
  }

  buildArticleResponse(article: ArticleEntity): IArticleResponse {
    return {
      article,
    };
  }

  private generateSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      //Math.random() - float number, Math.pow(36, 6) - makes integer, then toString(36) - unique string max 36 symbols
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }

  private async checkDtoFields<T>(dto: T, allowedFieldsToUpdate: string[]) {
    const keysToCheck = Object.keys(dto);
    if (!keysToCheck.length) {
      throw new HttpException(
        `provide fields to update article`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const unknownProperties = keysToCheck.filter(
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
    }
  }
}
