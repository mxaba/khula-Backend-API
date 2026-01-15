import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';

interface DealerMatch {
  dealerId: string;
  dealer: any;
  totalCost: number;
  distance: number;
  canFulfill: boolean;
  itemBreakdown: Array<{
    productId: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    availableStock: number;
  }>;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    // Validate all products exist and get their details
    const productsMap = new Map();
    for (const item of createOrderDto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { pricingTiers: { orderBy: { minQuantity: 'asc' } } },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      productsMap.set(item.productId, product);
    }

    // Find the best dealer match
    const bestMatch = await this.findBestDealer(
      createOrderDto.items,
      productsMap,
      createOrderDto.deliveryLatitude,
      createOrderDto.deliveryLongitude,
    );

    if (!bestMatch || !bestMatch.canFulfill) {
      throw new BadRequestException(
        'No dealer found with sufficient stock to fulfill this order',
      );
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate estimated delivery time (base time + distance factor)
    const estimatedDeliveryHours = this.calculateDeliveryTime(bestMatch.distance);

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (prisma) => {
      // Create the order
      const newOrder = await prisma.order.create({
        data: {
          orderNumber,
          farmerName: createOrderDto.farmerName,
          farmerPhone: createOrderDto.farmerPhone,
          farmerEmail: createOrderDto.farmerEmail,
          deliveryLatitude: createOrderDto.deliveryLatitude,
          deliveryLongitude: createOrderDto.deliveryLongitude,
          deliveryAddress: createOrderDto.deliveryAddress,
          dealerId: bestMatch.dealerId,
          status: 'CONFIRMED',
          totalAmount: bestMatch.totalCost,
          distanceKm: Math.round(bestMatch.distance * 100) / 100,
          estimatedDeliveryHours,
          confirmedAt: new Date(),
        },
        include: {
          dealer: true,
        },
      });

      // Create order items and reserve inventory
      for (const itemBreakdown of bestMatch.itemBreakdown) {
        // Create order item
        await prisma.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: itemBreakdown.productId,
            quantity: itemBreakdown.quantity,
            pricePerUnit: itemBreakdown.pricePerUnit,
            totalPrice: itemBreakdown.totalPrice,
          },
        });

        // Reserve inventory
        await prisma.inventory.updateMany({
          where: {
            dealerId: bestMatch.dealerId,
            productId: itemBreakdown.productId,
          },
          data: {
            reservedQty: {
              increment: itemBreakdown.quantity,
            },
            availableQty: {
              decrement: itemBreakdown.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    // Fetch complete order with items
    return this.findOne(order.id);
  }

  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      include: {
        dealer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        dealer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updateData: any = {
      status: updateStatusDto.status,
    };

    // Set deliveredAt timestamp when status is DELIVERED
    if (updateStatusDto.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        dealer: true,
        orderItems: true,
      },
    });

    return updatedOrder;
  }

  /**
   * Find the best dealer to fulfill the order based on:
   * 1. Stock availability (must have all items)
   * 2. Total cost (lowest price)
   * 3. Distance (nearest)
   */
  private async findBestDealer(
    items: Array<{ productId: string; quantity: number }>,
    productsMap: Map<string, any>,
    latitude: number,
    longitude: number,
  ): Promise<DealerMatch | null> {
    // Get all dealers with their inventory
    const dealers = await this.prisma.dealer.findMany({
      include: {
        inventory: {
          include: {
            product: {
              include: {
                pricingTiers: {
                  orderBy: { minQuantity: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const dealerMatches: DealerMatch[] = [];

    for (const dealer of dealers) {
      const match = this.evaluateDealer(dealer, items, productsMap, latitude, longitude);
      if (match) {
        dealerMatches.push(match);
      }
    }

    if (dealerMatches.length === 0) {
      return null;
    }

    // Sort by: 1. Can fulfill, 2. Total cost (ascending), 3. Distance (ascending)
    dealerMatches.sort((a, b) => {
      if (a.canFulfill !== b.canFulfill) {
        return a.canFulfill ? -1 : 1;
      }
      if (Math.abs(a.totalCost - b.totalCost) > 0.01) {
        return a.totalCost - b.totalCost;
      }
      return a.distance - b.distance;
    });

    return dealerMatches[0];
  }

  /**
   * Evaluate if a dealer can fulfill the order and calculate costs
   */
  private evaluateDealer(
    dealer: any,
    items: Array<{ productId: string; quantity: number }>,
    productsMap: Map<string, any>,
    farmerLat: number,
    farmerLon: number,
  ): DealerMatch | null {
    const itemBreakdown: Array<{
      productId: string;
      quantity: number;
      pricePerUnit: number;
      totalPrice: number;
      availableStock: number;
    }> = [];

    let totalCost = 0;
    let canFulfill = true;

    for (const item of items) {
      // Find inventory for this product
      const inventory = dealer.inventory.find((inv: any) => inv.productId === item.productId);

      if (!inventory || inventory.availableQty < item.quantity) {
        canFulfill = false;
        // Still calculate for comparison
        const availableStock = inventory ? inventory.availableQty : 0;
        const product = productsMap.get(item.productId);
        const pricePerUnit = this.productsService.calculatePrice(
          product.pricingTiers,
          item.quantity,
        ) / item.quantity;

        itemBreakdown.push({
          productId: item.productId,
          quantity: item.quantity,
          pricePerUnit,
          totalPrice: pricePerUnit * item.quantity,
          availableStock,
        });
        continue;
      }

      // Calculate price using product's pricing tiers
      const product = inventory.product;
      const totalPrice = this.productsService.calculatePrice(product.pricingTiers, item.quantity);
      const pricePerUnit = totalPrice / item.quantity;

      itemBreakdown.push({
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit,
        totalPrice,
        availableStock: inventory.availableQty,
      });

      totalCost += totalPrice;
    }

    // Calculate distance
    const distance = this.calculateDistance(
      farmerLat,
      farmerLon,
      dealer.latitude,
      dealer.longitude,
    );

    return {
      dealerId: dealer.id,
      dealer,
      totalCost,
      distance,
      canFulfill,
      itemBreakdown,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate estimated delivery time based on distance
   * Base time: 2 hours
   * Additional: 1 hour per 50km
   */
  private calculateDeliveryTime(distanceKm: number): number {
    const baseTime = 2; // hours
    const additionalTime = Math.ceil(distanceKm / 50);
    return baseTime + additionalTime;
  }
}
