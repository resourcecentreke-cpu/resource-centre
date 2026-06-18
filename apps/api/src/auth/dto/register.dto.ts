import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString() @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @IsOptional() @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid phone number' })
  phone?: string;
}
