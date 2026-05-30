import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { BooksService } from '../services/books.service';
import { CreateBookDto } from '../dto/books/create-book.dto';
import { UpdateBookDto } from '../dto/books/update-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadsDir = join(process.cwd(), 'uploads', 'books');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BIBLIOTECARIO, UserRole.ADMINISTRATIVO)
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  findAll(
    @Query('titulo') titulo?: string,
    @Query('autor') autor?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.booksService.findAll({ titulo, autor, categoria });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BIBLIOTECARIO, UserRole.ADMINISTRATIVO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(id, updateBookDto);
  }

  @Post(':id/cover')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BIBLIOTECARIO, UserRole.ADMINISTRATIVO)
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const extension = extname(file.originalname) || '.jpg';
          callback(null, `book-${uniqueSuffix}${extension}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: { filename: string },
  ) {
    if (!file) {
      throw new BadRequestException('Debes seleccionar una imagen');
    }

    const portadaUrl = `/uploads/books/${file.filename}`;
    return this.booksService.updateCover(id, portadaUrl);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BIBLIOTECARIO, UserRole.ADMINISTRATIVO)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
