export interface ErrorResponseDto {
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
  error: string | object;
  message?: string | string[] | object;
  requestId?: string;
  traceId?: string;
}
