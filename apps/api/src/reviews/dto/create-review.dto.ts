import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export enum ReviewTypeInput {
  Product = 'product',
  Store = 'store',
}

export class CreateReviewDto {
  @IsEnum(ReviewTypeInput)
  type!: ReviewTypeInput;

  @IsOptional() @IsString()
  productSlug?: string;

  @IsOptional() @IsString()
  sellerSlug?: string;

  @IsInt() @Min(1) @Max(5)
  rating!: number;

  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @IsString() @MinLength(4) @MaxLength(2000)
  body!: string;
}
