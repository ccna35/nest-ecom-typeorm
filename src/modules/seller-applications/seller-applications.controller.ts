import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SellerApplicationsService } from './seller-applications.service';
import { CreateSellerApplicationDto } from './dto/create-seller-application.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ApplicationStatus } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/authenticatedRequest.type';

@Controller('seller-applications')
@UseGuards(RolesGuard)
export class SellerApplicationsController {
  constructor(private readonly sellerApplicationsService: SellerApplicationsService) {}

  @Roles(UserRole.customer)
  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateSellerApplicationDto) {
    return this.sellerApplicationsService.create(request.user.userId, dto);
  }

  @Roles(UserRole.customer, UserRole.seller)
  @Get('me')
  getMyApplication(@Req() request: AuthenticatedRequest) {
    return this.sellerApplicationsService.findByUserId(request.user.userId);
  }

  @Roles(UserRole.admin)
  @Get()
  findAll(@Query('status') status?: ApplicationStatus) {
    return this.sellerApplicationsService.findAll(status);
  }

  @Roles(UserRole.admin)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sellerApplicationsService.findOne(id);
  }

  @Roles(UserRole.admin)
  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.sellerApplicationsService.approve(id, request.user.userId);
  }

  @Roles(UserRole.admin)
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.sellerApplicationsService.reject(id, request.user.userId, dto.rejectionReason);
  }
}
