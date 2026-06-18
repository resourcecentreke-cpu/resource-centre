import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export enum SellerStatusInput {
  Pending = 'pending',
  Active = 'active',
  Suspended = 'suspended',
}

export class UpdateSellerDto {
  @IsOptional() @IsEnum(SellerStatusInput)
  status?: SellerStatusInput;

  @IsOptional() @IsBoolean()
  isVerified?: boolean;
}
