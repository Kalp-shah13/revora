import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateFeedbackStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'id is required' })
  id!: string;

  @IsString()
  @IsIn(['open', 'resolved'], { message: 'Status must be open or resolved' })
  status!: 'open' | 'resolved';
}
