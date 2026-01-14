import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateDealerDto {
  @ApiProperty({
    description: 'Name of the agri-dealer',
    example: 'Green Valley Agri Supplies',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email address of the dealer',
    example: 'contact@greenvalley.co.za',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number of the dealer',
    example: '+27123456789',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Latitude coordinate of dealer location',
    example: -26.2041,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate of dealer location',
    example: 28.0473,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Physical address of the dealer',
    example: 'Johannesburg, Gauteng',
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}
