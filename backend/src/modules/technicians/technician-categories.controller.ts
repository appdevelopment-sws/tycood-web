import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TechnicianCategoriesService } from './technician-categories.service.js';
import { CreateTechnicianCategoryDto } from './dto/create-technician-category.dto.js';
import { UpdateTechnicianCategoryDto } from './dto/update-technician-category.dto.js';
import { CreateTechnicianServiceItemDto } from './dto/create-technician-service-item.dto.js';
import { UpdateTechnicianServiceItemDto } from './dto/update-technician-service-item.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { BusinessRole } from '../../common/enums/business-role.enum.js';

@ApiTags('Technician Categories & Services Catalog')
@Controller('technicians/categories')
export class TechnicianCategoriesController {
  constructor(private readonly categoriesService: TechnicianCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all active roadside technician categories with services' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.categoriesService.findAllCategories(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category entity' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findCategoryById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new service category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(@Body() dto: CreateTechnicianCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update service category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Updated category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateTechnicianCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete service category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Deletion status' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  // ==================== SERVICE CATALOG ITEMS ====================

  @Post('services')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a catalog service item (Admin only)' })
  @ApiResponse({ status: 201, description: 'Service item created' })
  async createServiceItem(@Body() dto: CreateTechnicianServiceItemDto) {
    return this.categoriesService.createServiceItem(dto);
  }

  @Patch('services/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update catalog service item (Admin only)' })
  @ApiParam({ name: 'id', description: 'Service Item UUID' })
  @ApiResponse({ status: 200, description: 'Updated service item' })
  async updateServiceItem(
    @Param('id') id: string,
    @Body() dto: UpdateTechnicianServiceItemDto,
  ) {
    return this.categoriesService.updateServiceItem(id, dto);
  }

  @Delete('services/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete catalog service item (Admin only)' })
  @ApiParam({ name: 'id', description: 'Service Item UUID' })
  @ApiResponse({ status: 200, description: 'Deletion status' })
  async deleteServiceItem(@Param('id') id: string) {
    return this.categoriesService.deleteServiceItem(id);
  }
}
