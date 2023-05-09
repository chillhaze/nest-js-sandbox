import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './article.entity';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { UserEntity } from '@app/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity, UserEntity])],
  controllers: [ArticleController],
  providers: [ArticleService, AuthGuard],
})
export class ArticleModule {}
