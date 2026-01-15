import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      name: 'Test Fertilizer',
      description: 'Test description',
      category: 'Fertilizers',
      unit: 'kg',
      pricingTiers: [
        { minQuantity: 0, maxQuantity: 50, pricePerUnit: 20 },
        { minQuantity: 50, maxQuantity: 100, pricePerUnit: 18 },
        { minQuantity: 100, pricePerUnit: 15 },
      ],
    };

    it('should create a new product', async () => {
      const expectedProduct = {
        id: '123',
        ...createProductDto,
        pricingTiers: createProductDto.pricingTiers.map((tier, index) => ({
          id: `tier-${index}`,
          ...tier,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductsService.create.mockResolvedValue(expectedProduct);

      const result = await controller.create(createProductDto);

      expect(result).toEqual(expectedProduct);
      expect(service.create).toHaveBeenCalledWith(createProductDto);
    });

    it('should throw BadRequestException for invalid pricing tiers', async () => {
      mockProductsService.create.mockRejectedValue(
        new BadRequestException('Invalid pricing tiers configuration'),
      );

      await expect(controller.create(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const expectedProducts = [
        {
          id: '1',
          name: 'Product 1',
          description: null,
          category: 'Seeds',
          unit: 'kg',
          pricingTiers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockProductsService.findAll.mockResolvedValue(expectedProducts);

      const result = await controller.findAll();

      expect(result).toEqual(expectedProducts);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const expectedProduct = {
        id: '123',
        name: 'Test Product',
        description: 'Test',
        category: 'Fertilizers',
        unit: 'kg',
        pricingTiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductsService.findOne.mockResolvedValue(expectedProduct);

      const result = await controller.findOne('123');

      expect(result).toEqual(expectedProduct);
      expect(service.findOne).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductsService.findOne.mockRejectedValue(
        new NotFoundException('Product with ID 999 not found'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
