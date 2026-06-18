import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum EventTypeInput {
  Search = 'search',
  ProductView = 'product_view',
  OfferClick = 'offer_click',
}

export class RecordEventDto {
  @IsEnum(EventTypeInput)
  type!: EventTypeInput;

  @IsOptional() @IsString()
  query?: string;

  @IsOptional() @IsString()
  productSlug?: string;

  @IsOptional() @IsString()
  sellerSlug?: string;
}
