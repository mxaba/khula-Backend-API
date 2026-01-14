import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DealersService } from './dealers.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealerDto } from './dto/create-dealer.dto';

describe('DealersService', () => {
  let service: DealersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    dealer: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DealersService>(DealersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDealerDto: CreateDealerDto = {
      name: 'Test Dealer',
      email: 'test@dealer.com',
      phone: '+27123456789',
      latitude: -26.2041,
      longitude: 28.0473,
      address: 'Johannesburg, Gauteng',
    };

    it('should create a new dealer successfully', async () => {
      const expectedDealer = {
        id: '123',
        ...createDealerDto,
        rating: 5.0,
        totalOrdersFulfilled: 0,
        averageDeliveryTime: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.dealer.findUnique.mockResolvedValue(null);
      mockPrismaService.dealer.create.mockResolvedValue(expectedDealer);

      const result = await service.create(createDealerDto);

      expect(result).toEqual(expectedDealer);
      expect(mockPrismaService.dealer.findUnique).toHaveBeenCalledWith({
        where: { email: createDealerDto.email },
      });
      expect(mockPrismaService.dealer.create).toHaveBeenCalledWith({
        data: createDealerDto,
      });
    });

    it('should throw ConflictException if dealer with email already exists', async () => {
      const existingDealer = {
        id: '123',
        email: 'test@dealer.com',
      };

      mockPrismaService.dealer.findUnique.mockResolvedValue(existingDealer);

      await expect(service.create(createDealerDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDealerDto)).rejects.toThrow(
        'Dealer with this email already exists',
      );
      expect(mockPrismaService.dealer.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of dealers', async () => {
      const expectedDealers = [
        {
          id: '1',
          name: 'Dealer 1',
          email: 'dealer1@test.com',
          phone: '+27123456789',
          latitude: -26.2041,
          longitude: 28.0473,
          address: 'Johannesburg',
          rating: 4.5,
          totalOrdersFulfilled: 10,
          averageDeliveryTime: 24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Dealer 2',
          email: 'dealer2@test.com',
          phone: '+27123456790',
          latitude: -25.7479,
          longitude: 28.2293,
          address: 'Pretoria',
          rating: 4.8,
          totalOrdersFulfilled: 20,
          averageDeliveryTime: 18,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.dealer.findMany.mockResolvedValue(expectedDealers);

      const result = await service.findAll();

      expect(result).toEqual(expectedDealers);
      expect(mockPrismaService.dealer.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no dealers exist', async () => {
      mockPrismaService.dealer.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a dealer by id', async () => {
      const expectedDealer = {
        id: '123',
        name: 'Test Dealer',
        email: 'test@dealer.com',
        phone: '+27123456789',
        latitude: -26.2041,
        longitude: 28.0473,
        address: 'Johannesburg',
        rating: 5.0,
        totalOrdersFulfilled: 0,
        averageDeliveryTime: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        inventory: [],
      };

      mockPrismaService.dealer.findUnique.mockResolvedValue(expectedDealer);

      const result = await service.findOne('123');

      expect(result).toEqual(expectedDealer);
      expect(mockPrismaService.dealer.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        include: {
          inventory: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if dealer not found', async () => {
      mockPrismaService.dealer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow('Dealer with ID 999 not found');
    });
  });

  describe('findByLocation', () => {
    it('should return dealers within specified radius', async () => {
      const dealers = [
        {
          id: '1',
          name: 'Nearby Dealer',
          email: 'nearby@test.com',
          phone: '+27123456789',
          latitude: -26.2041, // Johannesburg
          longitude: 28.0473,
          address: 'Johannesburg',
          rating: 4.5,
          totalOrdersFulfilled: 10,
          averageDeliveryTime: 24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Far Dealer',
          email: 'far@test.com',
          phone: '+27123456790',
          latitude: -29.8587, // Durban (over 500km away)
          longitude: 31.0218,
          address: 'Durban',
          rating: 4.8,
          totalOrdersFulfilled: 20,
          averageDeliveryTime: 18,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.dealer.findMany.mockResolvedValue(dealers);

      // Search from Johannesburg with 50km radius
      const result = await service.findByLocation(-26.2041, 28.0473, 50);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Nearby Dealer');
    });
  });
});
