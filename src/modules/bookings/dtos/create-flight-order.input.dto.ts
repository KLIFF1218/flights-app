import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProvider } from '@prisma/client';

export enum DocumentType {
  PASSPORT = 'PASSPORT',
}

export class NameInputDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

export class PhoneInputDto {
  @IsEnum(['MOBILE', 'LANDLINE'])
  deviceType: 'MOBILE' | 'LANDLINE';

  @IsString()
  countryCallingCode: string;

  @IsString()
  number: string;
}

export class TravelerContactInputDto {
  @IsOptional()
  @IsEmail()
  emailAddress?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhoneInputDto)
  phones?: PhoneInputDto[];
}

export class TravelerDocumentInputDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @Length(3, 20)
  number: string;

  @IsDateString()
  expiryDate: string;

  @IsDateString()
  issuanceDate: string;

  @IsString()
  @Length(2, 2)
  issuanceCountry: string;

  @IsString()
  birthPlace: string;

  @IsString()
  @Length(2, 2)
  nationality: string;
}

export class TravelerInputDto {
  @IsString()
  id: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(['MALE', 'FEMALE'])
  gender: 'MALE' | 'FEMALE';

  @ValidateNested()
  @Type(() => NameInputDto)
  name: NameInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TravelerContactInputDto)
  contact?: TravelerContactInputDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelerDocumentInputDto)
  documents?: TravelerDocumentInputDto[];
}

export class SeatAssignmentInputDto {
  @IsString()
  @Length(1, 20)
  travelerId: string;

  @IsString()
  @Length(1, 20)
  segmentId: string;

  @IsString()
  @Length(1, 5)
  @Matches(/^[0-9]{1,3}[A-Z]$/, {
    message: 'seatNumber must be like 12A, 3C, 20D',
  })
  seatNumber: string;
}

export class CreateFlightOrderInputDto {
  @IsString()
  searchId: string;

  @IsString()
  offerId: string;

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelerInputDto)
  travelers: TravelerInputDto[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SeatAssignmentInputDto)
  seats?: SeatAssignmentInputDto[];
}
