import { IsInt, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Public "tip us" STK push — sends an M-Pesa prompt to the supporter's phone. */
export class InitiateTipDto {
  @IsString()
  phone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(70000)
  amount!: number;
}
