import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { BooksModule } from './modules/books.module';
import { UsersModule } from './modules/users.module';
import { GradesModule } from './modules/grades.module';
import { AuthModule } from './modules/auth.module';
import { LoansModule } from './modules/loans.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { StudyRoomsModule } from './modules/study-rooms.module';
import { NotificationsModule } from './modules/notifications.module';
import { SubjectsModule } from './modules/subjects.module';
import { StatsModule } from './modules/stats.module'; // ✅ Nuevo
import { ReportsModule } from './modules/reports.module';
import { CatalogsModule } from './modules/catalogs.module';
import { ParticipantsModule } from './modules/participants.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('mail.user'),
            pass: configService.get<string>('mail.pass'),
          },
        },
        defaults: {
          from: `"Edu-Tech" <${configService.get<string>('mail.user')}>`,
        },
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: true,
        // `synchronize` ya crea todas las tablas a partir de las entidades.
        // Las migraciones se desactivan para evitar el conflicto de orden
        // (las migraciones corrían antes de que synchronize creara las tablas).
        migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
        migrationsRun: false,
        // Aiven (y la mayoría de MySQL gestionados) exigen conexión cifrada.
        // Se activa con DB_SSL=true en producción.
        ssl: configService.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : undefined,
      }),
    }),

    BooksModule,
    UsersModule,
    GradesModule,
    AuthModule,
    LoansModule,
    StudyRoomsModule,
    NotificationsModule,
    SubjectsModule,
    StatsModule, // ✅ Nuevo
    ReportsModule,
    CatalogsModule,
    ParticipantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
