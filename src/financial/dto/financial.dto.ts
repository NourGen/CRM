import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateAcademyLedgerDto {
  @IsOptional()
  @IsDateString()
  bookingDate?: string;

  @IsString()
  ocCode: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;
}

export class CreateClientPaymentDto {
  @IsString()
  legacyId: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
