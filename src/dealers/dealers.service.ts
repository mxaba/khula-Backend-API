import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { DealerResponseDto } from './dto/dealer-response.dto';
import { DistanceUtil } from '../common/utils/distance.util';

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
    const nearbyDealers = dealers.filter((dealer: any) => {
      const distance = DistanceUtil.calculateDistance(
        latitude,
        longitude,
        dealer.latitude,
        dealer.longitude,
      );
      return distance <= radiusKm;
    });

    return nearbyDealers;
  }
}
