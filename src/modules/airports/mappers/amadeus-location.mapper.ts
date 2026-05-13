import type { AmadeusLocation } from '../interfaces/airports.response.interface';
import type { AirportLocationDto } from '../dto/aiport.response.dto';

export function mapAmadeusLocationToDto(location: AmadeusLocation): AirportLocationDto {
  return {
    id: location.id,
    name: location.name,
    detailedName: location.detailedName,
    iataCode: location.iataCode,
    subType: location.subType,
    countryCode: location.address.countryCode,
    cityName: location.address.cityName,
    latitude: location.geoCode.latitude,
    longitude: location.geoCode.longitude,
    travelersScore: location.analytics?.travelers?.score,
  };
}
