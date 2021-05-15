import {
  HttpModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticateMiddleware } from './common/middlewares/authentication.middleware';
import { LogModule } from './common/modules/custom-logs/log.module';
import { Article } from './entities/article/article.entity';
import { Log } from './entities/log/log.entity';
import { Tag } from './entities/tag/tag.entity';
import { ArticleModule } from './modules/article/article.module';
import { ScheduleModule } from '@nestjs/schedule';

const env = process.env.NODE_ENV || 'development';

const envFilePath =
  env === 'development' ? '.env' : `.env${process.env.NODE_ENV}`;

const entities = [Log, Tag, Article];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, ScheduleModule.forRoot()],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: entities,
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    ArticleModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthenticateMiddleware).forRoutes('*');
  }
}
