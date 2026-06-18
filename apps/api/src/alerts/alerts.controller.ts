import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateAlertDto) {
    return this.alerts.create(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.alerts.listMine(user.userId);
  }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateAlertDto) {
    return this.alerts.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.alerts.remove(user.userId, id);
  }

  @Post('run')
  run() {
    return this.alerts.enqueueEvaluation();
  }
}
