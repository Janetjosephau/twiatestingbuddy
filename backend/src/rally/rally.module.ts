import { Module } from '@nestjs/common';
import { RallyController } from './rally.controller';
import { RallyService } from './rally.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RallyController],
  providers: [RallyService],
  exports: [RallyService],
})
export class RallyModule {}
