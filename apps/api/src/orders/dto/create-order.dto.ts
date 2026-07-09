import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrderDto {
  /** The offer being bought — price and seller are derived server-side. */
  @IsString()
  offerId!: string;

  @IsString() @MinLength(2) @MaxLength(80)
  customerName!: string;

  /** M-Pesa number that receives the STK push. */
  @IsString()
  phone!: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsString() @MinLength(2) @MaxLength(60)
  city!: string;

  @IsString() @MinLength(4) @MaxLength(200)
  address!: string;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
