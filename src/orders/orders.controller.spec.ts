import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto: CreateOrderDto = {
      farmerName: 'John Mokoena',
      farmerPhone: '+27123456789',
      farmerEmail: 'john@farm.co.za',
      deliveryLatitude: -26.1234,
      deliveryLongitude: 28.0567,
      deliveryAddress: 'Farm 123',
      items: [{ productId: 'product-1', quantity: 80 }],
    };

    it('should create an order', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-123',
        ...createOrderDto,
        dealer: { id: 'dealer-1', name: 'Test Dealer' },
        status: 'CONFIRMED',
        totalAmount: 1440,
        orderItems: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrdersService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(service.create).toHaveBeenCalledWith(createOrderDto);
    });

    it('should throw BadRequestException if no dealer found', async () => {
      mockOrdersService.create.mockRejectedValue(
        new BadRequestException('No dealer found with sufficient stock'),
      );

      await expect(controller.create(createOrderDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-123',
          status: 'CONFIRMED',
        },
      ];

      mockOrdersService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll();

      expect(result).toEqual(mockOrders);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-123',
      };

      mockOrdersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne('order-1');

      expect(result).toEqual(mockOrder);
      expect(service.findOne).toHaveBeenCalledWith('order-1');
    });

    it('should throw NotFoundException if order not found', async () => {
      mockOrdersService.findOne.mockRejectedValue(
        new NotFoundException('Order not found'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updateDto: UpdateOrderStatusDto = { status: OrderStatus.DELIVERED };
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DELIVERED,
      };

      mockOrdersService.updateStatus.mockResolvedValue(mockOrder);

      const result = await controller.updateStatus('order-1', updateDto);

      expect(result).toEqual(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith('order-1', updateDto);
    });
  });
});
