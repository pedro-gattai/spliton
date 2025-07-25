import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './interceptors/bigint.interceptor';

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

  // Configurar interceptor global para BigInt
  app.useGlobalInterceptors(new BigIntInterceptor());

  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://localhost:5173',
      'https://spliton.pages.dev',
      'https://developer.spliton.pages.dev',
      'https://*.spliton.pages.dev',
      'https://spliton-developer.up.railway.app',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
