import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString() @MinLength(2)
  name!: string;

  @IsString()
  brand!: string;

  @IsString()
  categorySlug!: string;

  @IsString()
  specSummary!: string;

  @IsOptional() @IsString()
  imageSlug?: string;

  @IsOptional() @IsArray()
  images?: string[];

  @IsOptional() @IsBoolean()
  isNew?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  brand?: string;

  @IsOptional() @IsString()
  categorySlug?: string;

  @IsOptional() @IsString()
  specSummary?: string;

  @IsOptional() @IsString()
  imageSlug?: string;

  @IsOptional() @IsArray()
  images?: string[];

  @IsOptional() @IsBoolean()
  isNew?: boolean;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsInt() @Min(0)
  minPrice?: number;
}
