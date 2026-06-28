import {
  Body, Controller, Get, Param, Post, Put, Query, UploadedFiles, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { ManageService } from './manage.service';
import { ManageKeyGuard } from './manage-key.guard';
import { CreateManagedProductDto } from './dto/create-managed-product.dto';

/** No-code product management for the /admin page (shared-key protected). */
@ApiTags('manage')
@UseGuards(ManageKeyGuard)
@Controller('manage')
export class ManageController {
  constructor(private readonly manage: ManageService) {}

  @Get('meta')
  meta() {
    return this.manage.meta();
  }

  @Get('products')
  list(@Query('q') q?: string) {
    return this.manage.list(q);
  }

  @Post('products')
  create(@Body() dto: CreateManagedProductDto) {
    return this.manage.create(dto);
  }

  // Upload one or more photos (appended to the product's gallery).
  @Post('products/:id/images')
  @UseInterceptors(FilesInterceptor('files', 8, { limits: { fileSize: 6 * 1024 * 1024 } }))
  upload(
    @Param('id') id: string,
    @UploadedFiles() files: Array<{ buffer: Buffer; mimetype: string }>,
  ) {
    return this.manage.addImages(id, files);
  }

  // Replace the ordered gallery (reorder, set primary = first, or remove items).
  @Put('products/:id/images')
  setImages(@Param('id') id: string, @Body() body: { images: string[] }) {
    return this.manage.setImages(id, body?.images ?? []);
  }
}
