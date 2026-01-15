import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingTierDto } from './pricing-tier.dto';

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'NPK Fertilizer',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the product',
    example: 'Nitrogen, Phosphorus, and Potassium fertilizer for optimal crop growth',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Product category',
    example: 'Fertilizers',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'kg',
    default: 'kg',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({
    description: 'Pricing tiers based on quantity',
    type: [PricingTierDto],
    example: [
      { minQuantity: 0, maxQuantity: 50, pricePerUnit: 20 },
      { minQuantity: 50, maxQuantity: 100, pricePerUnit: 18 },
      { minQuantity: 100, pricePerUnit: 15 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers: PricingTierDto[];
}
