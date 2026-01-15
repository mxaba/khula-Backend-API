import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validProductDto: CreateProductDto = {
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

    it('should create a product with valid pricing tiers', async () => {
      const expectedProduct = {
        id: '123',
        ...validProductDto,
        pricingTiers: validProductDto.pricingTiers.map((tier, index) => ({
          id: `tier-${index}`,
          productId: '123',
          ...tier,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.create.mockResolvedValue(expectedProduct);

      const result = await service.create(validProductDto);

      expect(result).toEqual(expectedProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if first tier does not start at 0', async () => {
      const invalidDto = {
        ...validProductDto,
        pricingTiers: [
          { minQuantity: 10, maxQuantity: 50, pricePerUnit: 20 },
        ],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'First pricing tier must start at quantity 0',
      );
    });

    it('should throw BadRequestException if tiers have gaps', async () => {
      const invalidDto = {
        ...validProductDto,
        pricingTiers: [
          { minQuantity: 0, maxQuantity: 50, pricePerUnit: 20 },
          { minQuantity: 60, maxQuantity: 100, pricePerUnit: 18 }, // Gap from 50-60
        ],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Gap or overlap detected',
      );
    });

    it('should throw BadRequestException if tiers overlap', async () => {
      const invalidDto = {
        ...validProductDto,
        pricingTiers: [
          { minQuantity: 0, maxQuantity: 60, pricePerUnit: 20 },
          { minQuantity: 50, maxQuantity: 100, pricePerUnit: 18 }, // Overlaps
        ],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Gap or overlap detected',
      );
    });

    it('should throw BadRequestException if minQuantity >= maxQuantity', async () => {
      const invalidDto = {
        ...validProductDto,
        pricingTiers: [
          { minQuantity: 0, maxQuantity: 0, pricePerUnit: 20 },
        ],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'minQuantity must be less than maxQuantity',
      );
    });

    it('should allow last tier to have no maxQuantity (unlimited)', async () => {
      const validDto = {
        ...validProductDto,
        pricingTiers: [
          { minQuantity: 0, maxQuantity: 50, pricePerUnit: 20 },
          { minQuantity: 50, pricePerUnit: 15 }, // No max
        ],
      };

      const expectedProduct = {
        id: '123',
        ...validDto,
        pricingTiers: validDto.pricingTiers.map((tier, index) => ({
          id: `tier-${index}`,
          productId: '123',
          ...tier,
          maxQuantity: tier.maxQuantity ?? null,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.create.mockResolvedValue(expectedProduct);

      const result = await service.create(validDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.product.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const expectedProducts = [
        {
          id: '1',
          name: 'Product 1',
          category: 'Seeds',
          unit: 'kg',
          pricingTiers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(expectedProducts);

      const result = await service.findAll();

      expect(result).toEqual(expectedProducts);
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const expectedProduct = {
        id: '123',
        name: 'Test Product',
        category: 'Fertilizers',
        unit: 'kg',
        pricingTiers: [],
        inventory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.findUnique.mockResolvedValue(expectedProduct);

      const result = await service.findOne('123');

      expect(result).toEqual(expectedProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow(
        'Product with ID 999 not found',
      );
    });
  });

  describe('calculatePrice', () => {
    const pricingTiers = [
      { minQuantity: 0, maxQuantity: 50, pricePerUnit: 20 },
      { minQuantity: 50, maxQuantity: 100, pricePerUnit: 18 },
      { minQuantity: 100, maxQuantity: null, pricePerUnit: 15 },
    ];

    it('should calculate price for quantity in first tier', () => {
      const result = service.calculatePrice(pricingTiers, 30);
      expect(result).toBe(600); // 30 * 20
    });

    it('should calculate price for quantity in second tier', () => {
      const result = service.calculatePrice(pricingTiers, 75);
      expect(result).toBe(1350); // 75 * 18
    });

    it('should calculate price for quantity in unlimited tier', () => {
      const result = service.calculatePrice(pricingTiers, 150);
      expect(result).toBe(2250); // 150 * 15
    });

    it('should throw BadRequestException if no tier matches', () => {
      const limitedTiers = [
        { minQuantity: 0, maxQuantity: 50, pricePerUnit: 20 },
      ];

      expect(() => service.calculatePrice(limitedTiers, 100)).toThrow(
        BadRequestException,
      );
    });
  });
});
