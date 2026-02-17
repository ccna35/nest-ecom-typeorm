import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { CreateSellerProfileDto } from './create-seller-profile.dto';

export class UpdateSellerProfileDto extends PartialType(CreateSellerProfileDto) {
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;
}
