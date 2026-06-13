import { Module } from '@nestjs/common';
import { CatalogsController } from '../controllers/catalogs.controller';

@Module({
  controllers: [CatalogsController],
})
export class CatalogsModule {}
