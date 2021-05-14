import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import { FormatResponseInterceptor } from './common/interceptors/response.interceptor';
import { LogModule } from './common/modules/custom-logs/log.module';
import { LogService } from './common/modules/custom-logs/log.service';
import { ArticleModule } from './modules/article/article.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(helmet());

  const configService = app.get(ConfigService);
  const port = configService.get('APP_PORT');

  const corsOptions: CorsOptions = {
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    exposedHeaders: '*',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  app.enableCors(corsOptions);

  const options = new DocumentBuilder()
    .setTitle('Kg-web APIs')
    .setDescription('Kg-web APIs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    include: [ArticleModule],
  });
  SwaggerModule.setup('api/swagger', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: false,
      skipNullProperties: true,
      skipUndefinedProperties: true,
      skipMissingProperties: true,
      transform: true,
    }),
  );

  // app.use('/images', express.static(join(__dirname, 'images')));
  // app.use('/audios', express.static(join(__dirname, 'audios')));
  // app.use('/pdf', express.static(join(__dirname, 'pdf')));
  // app.use('/asset', express.static(join(__dirname, 'asset')));
  const logService = app.select(LogModule).get(LogService);

  app.useGlobalFilters(new AllExceptionsFilter(logService));

  app.useGlobalInterceptors(new FormatResponseInterceptor());

  await app.listen(port, '0.0.0.0');

  console.log(`api app is working on port: ${port}`);
}
bootstrap();
