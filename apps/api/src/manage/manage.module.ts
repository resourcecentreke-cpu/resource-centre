import { Module } from '@nestjs/common';
import { ManageController } from './manage.controller';
import { ManageService } from './manage.service';
import { ManageKeyGuard } from './manage-key.guard';

@Module({
  controllers: [ManageController],
  providers: [ManageService, ManageKeyGuard],
})
export class ManageModule {}
