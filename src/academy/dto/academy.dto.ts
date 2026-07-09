import { IsString, IsOptional, IsBoolean, IsEmail, IsNumber } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateInstructorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  isBsa?: boolean;
}

export class CreateRoundDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsNumber()
  maxSeats?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  instructorName?: string;
}
