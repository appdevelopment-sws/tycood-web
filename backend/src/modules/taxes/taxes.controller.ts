import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TaxesService } from './taxes.service.js';
import { CreateTaxDto } from './dto/create-tax.dto.js';
import { UpdateTaxDto } from './dto/update-tax.dto.js';
import { QueryTaxesDto } from './dto/query-taxes.dto.js';

@ApiTags('Taxes')
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  @ApiOperation({
    summary: 'List and filter all taxes and surcharges',
    description:
      'Returns a list of defined tax entities with filtering, searching, and pagination support.',
  })
  @ApiResponse({ status: 200, description: 'Taxes retrieved successfully' })
  async findAll(@Query() query: QueryTaxesDto) {
    return this.taxesService.findAll(query);
  }

  @Post('seed-presets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed default industry tax presets',
    description:
      'Populates common standard tax definitions (GST, CGST, SGST, Airport Cess, Night Surcharge) if not existing.',
  })
  @ApiResponse({ status: 200, description: 'Presets populated' })
  async seedPresets() {
    return this.taxesService.seedPresets();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific tax definition by UUID' })
  @ApiParam({ name: 'id', description: 'Tax UUID' })
  @ApiResponse({ status: 200, description: 'Tax details retrieved' })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  async findOne(@Param('id') id: string) {
    return this.taxesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tax or surcharge' })
  @ApiResponse({ status: 201, description: 'Tax created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Tax code already exists' })
  async create(@Body() dto: CreateTaxDto) {
    return this.taxesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing tax definition' })
  @ApiParam({ name: 'id', description: 'Tax UUID' })
  @ApiResponse({ status: 200, description: 'Tax updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaxDto) {
    return this.taxesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle tax active / inactive status' })
  @ApiParam({ name: 'id', description: 'Tax UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async toggleActive(
    @Param('id') id: string,
    @Body('isActive') isActive?: boolean,
  ) {
    return this.taxesService.toggleActive(id, isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tax definition' })
  @ApiParam({ name: 'id', description: 'Tax UUID' })
  @ApiResponse({ status: 200, description: 'Tax deleted' })
  async remove(@Param('id') id: string) {
    return this.taxesService.remove(id);
  }
}
