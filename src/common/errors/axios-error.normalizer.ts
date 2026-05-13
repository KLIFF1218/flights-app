import axios from 'axios';
import type { NormalizedError } from './amadeus-error.normalizer';

export function normalizeAxiosError(error: unknown): NormalizedError | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return {
    status: error.response?.status ?? 502,
    code: 'EXTERNAL_HTTP_ERROR',
    message: 'External service unavailable',
  };
}
