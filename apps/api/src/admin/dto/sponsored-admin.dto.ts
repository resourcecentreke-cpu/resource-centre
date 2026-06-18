import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum SponsoredPlacementInput {
  HomeHero = 'home_hero',
  CategoryTop = 'category_top',
  ProductRelated = 'product_related',
}

export class CreateSponsoredDto {
  @IsString()
  sellerId!: string;

  @IsOptional() @IsString()
  productId?: string;

  @IsEnum(SponsoredPlacementInput)
  placement!: SponsoredPlacementInput;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;
}

export class UpdateSponsoredDto {
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
