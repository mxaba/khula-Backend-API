import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    // Validate pricing tiers
    this.validatePricingTiers(createProductDto.pricingTiers);

    // Create product with pricing tiers in a transaction
    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        category: createProductDto.category,
        unit: createProductDto.unit,
        pricingTiers: {
          create: createProductDto.pricingTiers.map((tier) => ({
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity ?? null,
            pricePerUnit: tier.pricePerUnit,
          })),
        },
      },
      include: {
        pricingTiers: {
          orderBy: { minQuantity: 'asc' },
        },
      },
    });

    return product;
  }

  async findAll(): Promise<ProductResponseDto[]> {
    return this.prisma.product.findMany({
      include: {
        pricingTiers: {
          orderBy: { minQuantity: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        pricingTiers: {
          orderBy: { minQuantity: 'asc' },
        },
        inventory: {
          include: {
            dealer: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Calculate price for a given quantity using pricing tiers
   */
  calculatePrice(pricingTiers: any[], quantity: number): number {
    // Find the applicable pricing tier
    const applicableTier = pricingTiers.find((tier) => {
      const meetsMin = quantity >= tier.minQuantity;
      const meetsMax = tier.maxQuantity === null || quantity <= tier.maxQuantity;
      return meetsMin && meetsMax;
    });

    if (!applicableTier) {
      throw new BadRequestException(
        `No pricing tier found for quantity ${quantity}`,
      );
    }

    return applicableTier.pricePerUnit * quantity;
  }

  /**
   * Validate pricing tiers for overlaps and gaps
   */
  private validatePricingTiers(tiers: any[]) {
    if (tiers.length === 0) {
      throw new BadRequestException('At least one pricing tier is required');
    }

    // Sort by minQuantity
    const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);

    // Check if first tier starts at 0
    if (sortedTiers[0].minQuantity !== 0) {
      throw new BadRequestException('First pricing tier must start at quantity 0');
    }

    // Validate each tier and check for overlaps/gaps
    for (let i = 0; i < sortedTiers.length; i++) {
      const currentTier = sortedTiers[i];

      // Validate minQuantity < maxQuantity for tiers with maxQuantity
      if (currentTier.maxQuantity !== null && currentTier.maxQuantity !== undefined) {
        if (currentTier.minQuantity >= currentTier.maxQuantity) {
          throw new BadRequestException(
            `minQuantity must be less than maxQuantity in tier at position ${i}`,
          );
        }
      }

      // Check relationships with next tier
      if (i < sortedTiers.length - 1) {
        const nextTier = sortedTiers[i + 1];

        // Current tier must have a maxQuantity if there's a next tier
        if (currentTier.maxQuantity === null || currentTier.maxQuantity === undefined) {
          throw new BadRequestException(
            `Pricing tier at position ${i} must have a maxQuantity when followed by another tier`,
          );
        }

        // Check for gaps or overlaps
        if (nextTier.minQuantity !== currentTier.maxQuantity) {
          throw new BadRequestException(
            `Gap or overlap detected between pricing tiers at positions ${i} and ${i + 1}`,
          );
        }
      }
    }
  }
}
