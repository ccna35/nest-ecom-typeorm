import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
