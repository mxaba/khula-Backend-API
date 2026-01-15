import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Farmer/customer name',
    example: 'John Mokoena',
  })
  @IsString()
  @IsNotEmpty()
  farmerName: string;

  @ApiProperty({
    description: 'Farmer/customer phone number',
    example: '+27123456789',
  })
  @IsString()
  @IsNotEmpty()
  farmerPhone: string;

  @ApiProperty({
    description: 'Farmer/customer email address',
    example: 'john@farm.co.za',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  farmerEmail?: string;

  @ApiProperty({
    description: 'Delivery latitude coordinate',
    example: -26.1234,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLatitude: number;

  @ApiProperty({
    description: 'Delivery longitude coordinate',
    example: 28.0567,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLongitude: number;

  @ApiProperty({
    description: 'Delivery address',
    example: 'Farm 123, Johannesburg South',
  })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({
    description: 'List of products to order',
    type: [CreateOrderItemDto],
    example: [
      { productId: 'product-uuid-123', quantity: 80 },
      { productId: 'product-uuid-456', quantity: 25 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
