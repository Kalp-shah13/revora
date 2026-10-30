import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Plan } from '@prisma/client';
import { IsGoogleReviewLink } from '../../common/utils/google-link.validator';

export class UpdateBusinessDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  @IsGoogleReviewLink()
  google_review_link?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  accent_color?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(Plan)
  @IsOptional()
  plan?: Plan;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
