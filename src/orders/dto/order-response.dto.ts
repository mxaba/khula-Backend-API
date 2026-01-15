import { ApiProperty } from '@nestjs/swagger';

class OrderItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  pricePerUnit: number;

  @ApiProperty()
  totalPrice: number;
}

class DealerInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  address: string;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Unique order identifier' })
  id: string;

  @ApiProperty({ description: 'Order number for tracking' })
  orderNumber: string;

  @ApiProperty({ description: 'Farmer/customer name' })
  farmerName: string;

  @ApiProperty({ description: 'Farmer/customer phone' })
  farmerPhone: string;

  @ApiProperty({ description: 'Farmer/customer email', nullable: true })
  farmerEmail: string | null;

  @ApiProperty({ description: 'Delivery address' })
  deliveryAddress: string;

  @ApiProperty({ description: 'Delivery latitude' })
  deliveryLatitude: number;

  @ApiProperty({ description: 'Delivery longitude' })
  deliveryLongitude: number;

  @ApiProperty({ description: 'Assigned dealer information', type: DealerInfo, nullable: true })
  dealer: DealerInfo | null;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Total order amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Estimated delivery time in hours', nullable: true })
  estimatedDeliveryHours: number | null;

  @ApiProperty({ description: 'Distance to dealer in kilometers', nullable: true })
  distanceKm: number | null;

  @ApiProperty({ description: 'Order items', type: [OrderItemResponse] })
  orderItems: OrderItemResponse[];

  @ApiProperty({ description: 'Order creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Order last updated date' })
  updatedAt: Date;
}
