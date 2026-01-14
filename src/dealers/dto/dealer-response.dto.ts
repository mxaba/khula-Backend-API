import { ApiProperty } from '@nestjs/swagger';

export class DealerResponseDto {
  @ApiProperty({ description: 'Unique identifier for the dealer' })
  id: string;

  @ApiProperty({ description: 'Name of the agri-dealer' })
  name: string;

  @ApiProperty({ description: 'Email address of the dealer' })
  email: string;

  @ApiProperty({ description: 'Phone number of the dealer' })
  phone: string;

  @ApiProperty({ description: 'Latitude coordinate of dealer location' })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate of dealer location' })
  longitude: number;

  @ApiProperty({ description: 'Physical address of the dealer' })
  address: string;

  @ApiProperty({ description: 'Dealer performance rating (0-5)', default: 5.0 })
  rating: number;

  @ApiProperty({ description: 'Total number of orders fulfilled', default: 0 })
  totalOrdersFulfilled: number;

  @ApiProperty({ description: 'Average delivery time in hours', default: 0 })
  averageDeliveryTime: number;

  @ApiProperty({ description: 'Date when dealer was registered' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when dealer info was last updated' })
  updatedAt: Date;
}
