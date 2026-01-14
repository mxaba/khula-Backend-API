import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { DealersService } from './dealers.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { DealerResponseDto } from './dto/dealer-response.dto';

@ApiTags('dealers')
@Controller('dealers')
export class DealersController {
  constructor(private readonly dealersService: DealersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new agri-dealer' })
  @ApiCreatedResponse({
    description: 'Dealer successfully registered',
    type: DealerResponseDto,
  })
  @ApiConflictResponse({ description: 'Dealer with this email already exists' })
  async create(@Body() createDealerDto: CreateDealerDto): Promise<DealerResponseDto> {
    return this.dealersService.create(createDealerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dealers' })
  @ApiResponse({
    status: 200,
    description: 'List of all registered dealers',
    type: [DealerResponseDto],
  })
  async findAll(): Promise<DealerResponseDto[]> {
    return this.dealersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dealer by ID' })
  @ApiResponse({
    status: 200,
    description: 'Dealer details',
    type: DealerResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Dealer not found' })
  async findOne(@Param('id') id: string): Promise<DealerResponseDto> {
    return this.dealersService.findOne(id);
  }
}
