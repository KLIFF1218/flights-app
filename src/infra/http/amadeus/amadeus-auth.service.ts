import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { Logger } from 'nestjs-pino';
import { AmadeusOAuthTokenResponse } from './interfaces/amadeus-auth.response';

@Injectable()
export class AmadeusAuthService {
  constructor(private readonly logger: Logger) {}
  private accessToken: string | null = null;
  private expiresAt = 0;

  async getToken(forceRefresh = false): Promise<string> {
    const now = Date.now();

    if (!forceRefresh && this.accessToken && now < this.expiresAt) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<AmadeusOAuthTokenResponse>(
        'https://test.api.amadeus.com/v1/security/oauth2/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.AMADEUS_CLIENT_ID!,
          client_secret: process.env.AMADEUS_CLIENT_SECRET!,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.expiresAt = now + response.data.expires_in * 1000 - 60_000;

      return this.accessToken;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const err = error as AxiosError;

        this.logger.error(
          {
            message: err.message,
            status: err.response?.status,
            response: err.response?.data,
          },
          'Amadeus OAuth request failed',
        );

        if (err.response?.status === 401) {
          throw new UnauthorizedException('Invalid Amadeus credentials');
        }

        if (err.response?.status && err.response.status >= 500) {
          throw new ServiceUnavailableException('Amadeus service is unavailable');
        }

        throw new InternalServerErrorException('Failed to authenticate with Amadeus');
      }

      this.logger.error(error, 'Unexpected error during Amadeus auth');

      throw new InternalServerErrorException('Unexpected error during Amadeus auth');
    }
  }
}
