import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'business_name is required' })
  @MaxLength(100, { message: 'business_name must not exceed 100 characters' })
  business_name!: string;

  @IsString()
  @IsNotEmpty({ message: 'business_id is required' })
  business_id!: string;

  @IsArray()
  selected_tags!: string[];

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'customer_notes must not exceed 200 characters' })
  customer_notes?: string;
}

