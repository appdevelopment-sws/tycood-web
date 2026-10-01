import {
  Controller,
  Get,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve all system settings and integration keys',
    description:
      'Returns categorized configuration keys. Secret tokens are masked by default.',
  })
  @ApiQuery({
    name: 'includeSecrets',
    required: false,
    type: Boolean,
    description: 'Whether to return unmasked secrets (super-admin only)',
  })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getAllSettings(@Query('includeSecrets') includeSecrets?: string) {
    const showSecrets = includeSecrets === 'true' || includeSecrets === '1';
    return this.settingsService.getAllSettings(showSecrets);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get specific setting value by key' })
  @ApiParam({ name: 'key', description: 'Setting key identifier' })
  @ApiResponse({ status: 200, description: 'Setting value retrieved' })
  async getSetting(@Param('key') key: string) {
    const val = await this.settingsService.getSetting(key);
    return { key, value: val };
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update system settings and API keys',
    description: 'Updates configuration key-values atomically.',
  })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
