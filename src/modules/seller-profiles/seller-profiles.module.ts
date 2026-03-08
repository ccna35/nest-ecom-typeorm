import { Module } from '@nestjs/common';
import { SellerProfilesController } from './seller-profiles.controller';
import { SellerProfilesService } from './seller-profiles.service';

@Module({
  controllers: [SellerProfilesController],
  providers: [SellerProfilesService],
  exports: [SellerProfilesService],
})
export class SellerProfilesModule {}
