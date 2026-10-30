import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SubmitReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'business_id is required' })
  business_id!: string;

  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating!: number;

  @IsArray()
  @IsOptional()
  selected_tags?: string[];

  @IsString()
  @IsOptional()
  ai_variant_chosen?: string;

  @IsBoolean()
  @IsOptional()
  redirected_to_google?: boolean;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  contact_info?: string;
}
