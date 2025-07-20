import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar CORS
  app.enableCors({
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
