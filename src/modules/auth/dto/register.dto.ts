import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать не меньше 8 символов' })
  @MaxLength(128, { message: 'Пароль должен содержать не больше 128 символов' })
  password: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;
}
