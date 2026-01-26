import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Swagger Documentation')
    .setDescription('Documentation')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger/api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
