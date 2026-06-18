import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum StockInput {
  In = 'in',
  Low = 'low',
  Out = 'out',
}

export class UpsertOfferDto {
  @IsString()
  sellerId!: string;

  @IsInt() @Min(1)
  price!: number;

  @IsOptional() @IsInt() @Min(0)
  deliveryFee?: number;

  @IsOptional() @IsEnum(StockInput)
  inStock?: StockInput;

  @IsOptional() @IsString()
  productUrl?: string;
}
