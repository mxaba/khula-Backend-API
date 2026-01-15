import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Product ID to order',
    example: 'product-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantity to order',
    example: 80,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  quantity: number;
}
