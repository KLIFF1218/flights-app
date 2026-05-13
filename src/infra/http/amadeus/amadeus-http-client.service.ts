import { Injectable, HttpException } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { amadeusAxios } from './amadeus-axios.client';
import { AmadeusAuthService } from './amadeus-auth.service';
import { Logger } from 'nestjs-pino';

@Injectable()
export class AmadeusHttpClient {
  constructor(
    private readonly auth: AmadeusAuthService,
    private readonly logger: Logger,
  ) {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    amadeusAxios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      const token = await this.auth.getToken();
      config.headers.Authorization = `Bearer ${token}`;

      return config;
    });

    amadeusAxios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          const freshToken = await this.auth.getToken(true);

          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${freshToken}`,
          };

          return amadeusAxios(originalRequest);
        }
        this.logger.error('Amadeus request failed', error);
        throw new HttpException(
          error.response?.data ?? 'Amadeus request failed',
          error.response?.status ?? 500,
        );
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log('start amadeus get request')
    const res = await amadeusAxios.get<T>(url, config);
    return res.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await amadeusAxios.post<T>(url, data, config);
    return res.data;
  }
}
