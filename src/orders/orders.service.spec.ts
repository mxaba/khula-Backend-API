import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './dto/update-order-status.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let productsService: ProductsService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    dealer: {
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
    },
    inventory: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockProductsService = {
    calculatePrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    productsService = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto: CreateOrderDto = {
      farmerName: 'John Mokoena',
      farmerPhone: '+27123456789',
      farmerEmail: 'john@farm.co.za',
      deliveryLatitude: -26.1234,
      deliveryLongitude: 28.0567,
      deliveryAddress: 'Farm 123',
      items: [
        { productId: 'product-1', quantity: 80 },
      ],
    };

    const mockProduct = {
      id: 'product-1',
      name: 'NPK Fertilizer',
      pricingTiers: [
        { minQuantity: 0, maxQuantity: 50, pricePerUnit: 20 },
        { minQuantity: 50, maxQuantity: 100, pricePerUnit: 18 },
        { minQuantity: 100, maxQuantity: null, pricePerUnit: 15 },
      ],
    };

    const mockDealer = {
      id: 'dealer-1',
      name: 'Test Dealer',
      latitude: -26.2041,
      longitude: 28.0473,
      inventory: [
        {
          productId: 'product-1',
          availableQty: 100,
          product: mockProduct,
        },
      ],
    };

    it('should create an order with best dealer match', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.dealer.findMany.mockResolvedValue([mockDealer]);
      mockProductsService.calculatePrice.mockReturnValue(1440); // 80 * 18

      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-123',
        ...createOrderDto,
        dealerId: 'dealer-1',
        status: 'CONFIRMED',
        totalAmount: 1440,
        distanceKm: 10,
        estimatedDeliveryHours: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        dealer: mockDealer,
        orderItems: [],
      });

      const result = await service.create(createOrderDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: { pricingTiers: { orderBy: { minQuantity: 'asc' } } },
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.create(createOrderDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createOrderDto)).rejects.toThrow(
        'Product with ID product-1 not found',
      );
    });

    it('should throw BadRequestException if no dealer has sufficient stock', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const dealerWithoutStock = {
        ...mockDealer,
        inventory: [
          {
            productId: 'product-1',
            availableQty: 10, // Not enough stock
            product: mockProduct,
          },
        ],
      };

      mockPrismaService.dealer.findMany.mockResolvedValue([dealerWithoutStock]);
      mockProductsService.calculatePrice.mockReturnValue(1440);

      await expect(service.create(createOrderDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createOrderDto)).rejects.toThrow(
        'No dealer found with sufficient stock to fulfill this order',
      );
    });

    it('should select dealer with lowest total cost', async () => {
      const cheaperDealer = {
        id: 'dealer-2',
        name: 'Cheaper Dealer',
        latitude: -26.3,
        longitude: 28.1,
        inventory: [
          {
            productId: 'product-1',
            availableQty: 100,
            product: {
              ...mockProduct,
              pricingTiers: [
                { minQuantity: 0, maxQuantity: 100, pricePerUnit: 15 }, // Cheaper!
              ],
            },
          },
        ],
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.dealer.findMany.mockResolvedValue([mockDealer, cheaperDealer]);

      // First call for expensive dealer, second for cheaper
      mockProductsService.calculatePrice
        .mockReturnValueOnce(1440) // 80 * 18
        .mockReturnValueOnce(1200); // 80 * 15

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      const mockOrder = {
        id: 'order-1',
        dealerId: 'dealer-2', // Should select cheaper dealer
        dealer: cheaperDealer,
        orderItems: [],
      };

      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto);

      expect(result.dealer?.id).toBe('dealer-2');
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-123',
          status: 'CONFIRMED',
          dealer: { id: 'dealer-1', name: 'Test Dealer' },
          orderItems: [],
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(result).toEqual(mockOrders);
      expect(mockPrismaService.order.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-123',
        dealer: { id: 'dealer-1' },
        orderItems: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'CONFIRMED',
      };

      const updatedOrder = {
        ...mockOrder,
        status: 'DELIVERED',
        deliveredAt: new Date(),
        dealer: null,
        orderItems: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('order-1', { status: OrderStatus.DELIVERED });

      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(mockPrismaService.order.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', { status: OrderStatus.DELIVERED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
