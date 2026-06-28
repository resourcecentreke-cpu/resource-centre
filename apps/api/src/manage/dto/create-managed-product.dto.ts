import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateManagedProductDto {
  @IsString() @MinLength(2)
  name!: string;

  @IsString()
  categorySlug!: string;

  @IsOptional() @IsString()
  brand?: string;

  @IsOptional() @IsString()
  specSummary?: string;

  @Type(() => Number) @IsInt() @Min(0)
  price!: number;

  @IsOptional() @IsBoolean()
  isNew?: boolean;
}
