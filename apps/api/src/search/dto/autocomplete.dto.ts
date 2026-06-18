import { IsString, MinLength } from 'class-validator';

export class AutocompleteDto {
  @IsString() @MinLength(1)
  q!: string;
}
