import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

@ApiTags('Transactions & Wallet Ledger')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get transaction history and financial metrics for current partner or user',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated transactions list with metrics (totalEarnings, todayEarnings, balance)',
  })
  async getMyTransactions(
    @CurrentUser() user: CurrentUserDto,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionsService.getUserTransactions(user.userId, query);
  }

  @Post('payout')
  @ApiOperation({
    summary: 'Request instant wallet payout / settlement to bank account or UPI',
  })
  @ApiResponse({
    status: 201,
    description: 'Payout transaction recorded successfully',
  })
  async requestPayout(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreatePayoutDto,
  ) {
    return this.transactionsService.requestPayout(user.userId, dto);
  }

  @Get('facility/:locationId')
  @ApiOperation({
    summary: 'Get transactions ledger for specific parking facility',
  })
  @ApiParam({ name: 'locationId', description: 'Parking facility UUID' })
  @ApiResponse({
    status: 200,
    description: 'Facility transaction records and totals',
  })
  async getFacilityTransactions(
    @CurrentUser() user: CurrentUserDto,
    @Param('locationId') locationId: string,
    @Query() query: QueryTransactionsDto,
  ) {
    query.locationId = locationId;
    return this.transactionsService.getUserTransactions(user.userId, query);
  }
}
