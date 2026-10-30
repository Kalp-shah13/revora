import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty({ message: 'Tag label is required' })
  label!: string;

  @IsString()
  @IsOptional()
  @IsIn(['service', 'category'], {
    message: 'tag_type must be either service or category',
  })
  tag_type?: 'service' | 'category';

  @IsString()
  @IsOptional()
  business_id?: string;
}

export class DeleteTagDto {
  @IsString()
  @IsNotEmpty({ message: 'Tag ID is required' })
  id!: string;
}
