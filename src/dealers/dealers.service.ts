import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { DealerResponseDto } from './dto/dealer-response.dto';

@Injectable()
export class DealersService {
  constructor(private prisma: PrismaService) {}

  async create(createDealerDto: CreateDealerDto): Promise<DealerResponseDto> {
    // Check if dealer with this email already exists
    const existingDealer = await this.prisma.dealer.findUnique({
      where: { email: createDealerDto.email },
    });

    if (existingDealer) {
      throw new ConflictException('Dealer with this email already exists');
    }

    // Create new dealer
    const dealer = await this.prisma.dealer.create({
      data: createDealerDto,
    });

    return dealer;
  }

  async findAll(): Promise<DealerResponseDto[]> {
    return this.prisma.dealer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<DealerResponseDto> {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!dealer) {
      throw new NotFoundException(`Dealer with ID ${id} not found`);
    }

    return dealer;
  }

  async findByLocation(latitude: number, longitude: number, radiusKm: number = 50) {
    // Get all dealers and calculate distance
    const dealers = await this.prisma.dealer.findMany();

    // Filter by distance using Haversine formula
    const nearbyDealers = dealers.filter((dealer) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        dealer.latitude,
        dealer.longitude,
      );
      return distance <= radiusKm;
    });

    return nearbyDealers;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
