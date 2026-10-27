import { IsNotEmpty, IsString } from 'class-validator';

export class AdminGenerateQrDto {
  @IsString()
  @IsNotEmpty({ message: 'business_id is required' })
  business_id!: string;
}
