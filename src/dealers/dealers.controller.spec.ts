import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DealersController } from './dealers.controller';
import { DealersService } from './dealers.service';
import { CreateDealerDto } from './dto/create-dealer.dto';

describe('DealersController', () => {
  let controller: DealersController;
  let service: DealersService;

  const mockDealersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealersController],
      providers: [
        {
          provide: DealersService,
          useValue: mockDealersService,
        },
      ],
    }).compile();

    controller = module.get<DealersController>(DealersController);
    service = module.get<DealersService>(DealersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    it('should create a new dealer', async () => {
      const expectedDealer = {
        id: '123',
        ...createDealerDto,
        rating: 5.0,
        totalOrdersFulfilled: 0,
        averageDeliveryTime: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDealersService.create.mockResolvedValue(expectedDealer);

      const result = await controller.create(createDealerDto);

      expect(result).toEqual(expectedDealer);
      expect(service.create).toHaveBeenCalledWith(createDealerDto);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockDealersService.create.mockRejectedValue(
        new ConflictException('Dealer with this email already exists'),
      );

      await expect(controller.create(createDealerDto)).rejects.toThrow(ConflictException);
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
      ];

      mockDealersService.findAll.mockResolvedValue(expectedDealers);

      const result = await controller.findAll();

      expect(result).toEqual(expectedDealers);
      expect(service.findAll).toHaveBeenCalled();
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
      };

      mockDealersService.findOne.mockResolvedValue(expectedDealer);

      const result = await controller.findOne('123');

      expect(result).toEqual(expectedDealer);
      expect(service.findOne).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if dealer not found', async () => {
      mockDealersService.findOne.mockRejectedValue(
        new NotFoundException('Dealer with ID 999 not found'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
