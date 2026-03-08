import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { SellerProfilesService } from './seller-profiles.service';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/authenticatedRequest.type';

@Controller('seller-profiles')
@UseGuards(RolesGuard)
export class SellerProfilesController {
  constructor(private readonly sellerProfilesService: SellerProfilesService) {}

  @Public()
  @Get()
  findAll() {
    return this.sellerProfilesService.findAll();
  }

  @Roles(UserRole.seller)
  @Get('me')
  async getMyProfile(@Req() request: AuthenticatedRequest) {
    const profile = await this.sellerProfilesService.findByUserId(request.user.userId);
    return profile;
  }

  @Roles(UserRole.seller)
  @Patch('me')
  updateMyProfile(@Req() request: AuthenticatedRequest, @Body() dto: UpdateSellerProfileDto) {
    return this.sellerProfilesService.update(request.user.userId, dto);
  }

  @Public()
  @Get(':userId')
  async getProfileByUserId(@Param('userId') userId: string) {
    const profile = await this.sellerProfilesService.findByUserId(userId);
    return profile;
  }
}
