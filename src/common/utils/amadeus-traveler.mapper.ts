import type {
  AmadeusDocumentDto,
  AmadeusTravelerDto,
} from 'src/modules/bookings/dtos/amadeus-traveler.dto';
import type {
  TravelerDocumentInputDto,
  TravelerInputDto,
} from 'src/modules/bookings/dtos/create-flight-order.input.dto';

function mapDocument(doc: TravelerDocumentInputDto): AmadeusDocumentDto {
  return {
    documentType: doc.documentType,
    number: doc.number,
    birthPlace: doc.issuanceCountry,
    expiryDate: doc.expiryDate,
    issuanceCountry: doc.issuanceCountry,
    validityCountry: doc.issuanceCountry,
    nationality: doc.nationality,
    holder: true,
    issuanceLocation: doc.issuanceCountry,
    issuanceDate: doc.issuanceDate,
  };
}

export function mapTravelerToAmadeus(traveler: TravelerInputDto): AmadeusTravelerDto {
  return {
    id: traveler.id,
    dateOfBirth: traveler.dateOfBirth,
    gender: traveler.gender,
    name: { firstName: traveler.name.firstName, lastName: traveler.name.lastName },
    contact: traveler.contact,
    documents: traveler.documents?.map(mapDocument),
  };
}
