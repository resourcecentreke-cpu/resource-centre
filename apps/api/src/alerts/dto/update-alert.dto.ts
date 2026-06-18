import { ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AlertChannelInput } from './create-alert.dto';

export enum AlertStatusInput {
  Active = 'active',
  Paused = 'paused',
  Cancelled = 'cancelled',
}

export class UpdateAlertDto {
  @IsOptional() @IsInt() @Min(1)
  targetPrice?: number;

  @IsOptional() @IsArray() @ArrayUnique() @IsEnum(AlertChannelInput, { each: true })
  channels?: AlertChannelInput[];

  @IsOptional() @IsEnum(AlertStatusInput)
  status?: AlertStatusInput;
}
