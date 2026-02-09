import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  sku!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Accept price as string "12.50".
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  price!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
