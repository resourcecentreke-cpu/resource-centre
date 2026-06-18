import { ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum AlertChannelInput {
  Email = 'email',
  Sms = 'sms',
  Whatsapp = 'whatsapp',
}

export class CreateAlertDto {
  @IsString()
  productId!: string;

  @IsInt() @Min(1)
  targetPrice!: number;

  @IsOptional() @IsArray() @ArrayUnique() @IsEnum(AlertChannelInput, { each: true })
  channels?: AlertChannelInput[];
}
