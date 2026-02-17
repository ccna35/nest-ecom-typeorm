import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  rejectionReason!: string;
}
