import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSellerApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storeName!: string;

  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  storeDescription!: string;
}
