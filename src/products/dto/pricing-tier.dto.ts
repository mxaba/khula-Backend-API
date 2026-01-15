import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PricingTierDto {
  @ApiProperty({
    description: 'Minimum quantity for this pricing tier',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  minQuantity: number;

  @ApiProperty({
    description: 'Maximum quantity for this pricing tier (null for unlimited)',
    example: 50,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxQuantity?: number;

  @ApiProperty({
    description: 'Price per unit for this tier',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;
}
