import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSellerProfileDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storeName!: string;

  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  storeDescription!: string;
}
