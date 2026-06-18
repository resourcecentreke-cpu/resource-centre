import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum PaymentPurposeInput {
  Subscription = 'subscription',
  Sponsored = 'sponsored',
}

export enum PlanInput {
  Basic = 'basic',
  Premium = 'premium',
  Enterprise = 'enterprise',
}

export class InitiatePaymentDto {
  @IsEnum(PaymentPurposeInput)
  purpose!: PaymentPurposeInput;

  @IsString()
  phone!: string;

  @IsString()
  sellerId!: string;

  // subscription
  @IsOptional() @IsEnum(PlanInput)
  plan?: PlanInput;

  // sponsored
  @IsOptional() @IsString()
  sponsoredListingId?: string;

  @IsOptional() @IsInt() @Min(1)
  amount?: number; // required for sponsored; derived for subscription
}
