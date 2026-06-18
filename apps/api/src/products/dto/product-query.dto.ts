import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ProductSort {
  PriceAsc = 'price_asc',
  PriceDesc = 'price_desc',
  Newest = 'newest',
  Name = 'name',
}

export class ProductQueryDto extends PaginationDto {
  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @IsString()
  category?: string; // category slug

  @IsOptional() @IsString()
  brand?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxPrice?: number;

  @IsOptional() @Type(() => Boolean)
  inStock?: boolean;

  @IsOptional() @Type(() => Boolean)
  isNew?: boolean;

  @IsOptional() @IsEnum(ProductSort)
  sort: ProductSort = ProductSort.PriceAsc;
}
