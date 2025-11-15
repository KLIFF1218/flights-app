import {
  IsString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsBoolean,
  IsISO8601,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class AmountDto {
  @IsNumberString()
  value: string;

  @IsString()
  currency: string;
}

class PaymentMethodCardDto {
  @IsOptional()
  @IsString()
  first6?: string;

  @IsOptional()
  @IsString()
  last4?: string;
}

class PaymentMethodDto {
  @IsString()
  type: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodCardDto)
  card?: PaymentMethodCardDto;
}

class ObjectDto {
  @IsString()
  id: string;

  @IsIn(['pending', 'waiting_for_capture', 'succeeded', 'canceled'])
  status: string;

  @ValidateNested()
  @Type(() => AmountDto)
  amount: AmountDto;

  @IsObject()
  metadata: { transactionId: string; bookingId: string };

  @IsISO8601()
  created_at: string;

  @IsOptional()
  @IsBoolean()
  test?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  payment_method?: PaymentMethodDto;
}

export class YooKassaWebhookDto {
  @IsIn(['notification'])
  type: string;

  @IsIn([
    'payment.waiting_for_capture',
    'payment.succeeded',
    'payment.canceled',
    'refund.succeeded',
  ])
  event: string;

  @ValidateNested()
  @Type(() => ObjectDto)
  object: ObjectDto;
}
