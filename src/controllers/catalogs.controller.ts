import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BookCategory, BookStatus } from '../entities/book.entity';
import { StudyRoomStatus } from '../entities/study-room.entity';
import { UserRole, UserStatus } from '../entities/user.entity';

const toLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

@ApiTags('catalogs')
@Controller('catalogs')
export class CatalogsController {
  @Get()
  @Public()
  getSystemCatalogs() {
    return {
      bookCategories: Object.values(BookCategory).map((value) => ({
        value,
        label: toLabel(value),
      })),
      userRoles: Object.keys(UserRole).map((value) => ({
        value,
        label: toLabel(value),
      })),
      userStatuses: Object.keys(UserStatus).map((value) => ({
        value,
        label: toLabel(value),
      })),
      studyRoomStatuses: Object.values(StudyRoomStatus).map((value) => ({
        value,
        label: toLabel(value),
      })),
      bookStatuses: Object.values(BookStatus).map((value) => ({
        value,
        label: toLabel(value),
      })),
    };
  }
}
