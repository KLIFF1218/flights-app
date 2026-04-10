import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

export class FlightsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;
}