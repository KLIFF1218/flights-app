
import { IsDateString, IsEnum, IsString } from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export class TravelerInputDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  email: string;

  @IsString()
  phoneCountryCode: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  passportNumber: string;

  @IsDateString()
  passportIssuanceDate: string;

  @IsDateString()
  passportExpiry: string;

  @IsString()
  birthPlace: string;

  @IsString()
  nationality: string;
}
