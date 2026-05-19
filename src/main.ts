import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  // Habilitar CORS para que el frontend pueda conectarse
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Edu-Tech API')
    .setDescription('Documentación de la API del sistema de gestión académica y bibliotecaria')
    .setVersion('1.0')
    .addBearerAuth() // Soporte para JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);

  const appUrl = `http://localhost:${port}`;
  const swaggerUrl = `${appUrl}/api`;

  console.log(`Backend disponible en: ${appUrl}`);
  console.log(`Swagger disponible en: ${swaggerUrl}`);
}
bootstrap();
