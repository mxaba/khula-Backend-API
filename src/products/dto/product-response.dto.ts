import { ApiProperty } from '@nestjs/swagger';

class PricingTierResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  minQuantity: number;

  @ApiProperty({ nullable: true })
  maxQuantity: number | null;

  @ApiProperty()
  pricePerUnit: number;
}

export class ProductResponseDto {
  @ApiProperty({ description: 'Unique identifier for the product' })
  id: string;

  @ApiProperty({ description: 'Name of the product' })
  name: string;

  @ApiProperty({ description: 'Description of the product', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Product category' })
  category: string;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Pricing tiers for the product', type: [PricingTierResponse] })
  pricingTiers: PricingTierResponse[];

  @ApiProperty({ description: 'Date when product was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when product was last updated' })
  updatedAt: Date;
}
