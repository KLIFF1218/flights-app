import type { DocumentType } from './create-flight-order.input.dto';

export class AmadeusDocumentDto {
  documentType: DocumentType;
  number: string;
  expiryDate: string;
  issuanceCountry: string;
  birthPlace: string;
  validityCountry: string;
  nationality: string;
  holder: boolean;
  issuanceDate: string;
  issuanceLocation: string;
}

export class AmadeusTravelerDto {
  id: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  name: {
    firstName: string;
    lastName: string;
  };
  contact?: {
    emailAddress?: string;
    phones?: {
      deviceType: 'MOBILE' | 'LANDLINE';
      countryCallingCode: string;
      number: string;
    }[];
  };
  documents?: AmadeusDocumentDto[];
}
