import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Plan } from '@prisma/client';
import { IsGoogleReviewLink } from '../../common/utils/google-link.validator';

export class NewOwnerDto {
  @IsEmail({}, { message: 'Owner email must be a valid email' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Owner password must be at least 6 characters' })
  password!: string;

  @IsString()
  @IsOptional()
  full_name?: string;
}

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  name!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty({ message: 'Google review link is required' })
  @IsGoogleReviewLink()
  google_review_link!: string;

  @IsString()
  @IsOptional()
  owner_id?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewOwnerDto)
  new_owner?: NewOwnerDto;

  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(Plan)
  @IsOptional()
  plan?: Plan;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  accent_color?: string;
}
