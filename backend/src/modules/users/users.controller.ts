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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

@ApiTags('Users & RBAC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users with pagination, role filtering, and search' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all available system and business roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async getAllRoles() {
    return this.usersService.getAllRoles();
  }

  @Get(':id')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User entity with roles' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create user with credentials (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user profile (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Updated user entity' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/roles')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign a role to user (Admin only - prevents self privilege escalation)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 201, description: 'Role assigned' })
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() admin: CurrentUserDto,
  ) {
    return this.usersService.assignRole(
      id,
      dto.roleName,
      dto.status,
      admin.userId,
    );
  }

  @Delete(':id/roles/:roleId')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an assigned role from a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiResponse({ status: 204, description: 'Role removed' })
  async removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.removeRole(id, roleId);
  }

  @Delete(':id')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete or deactivate user account (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted or deactivated' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
