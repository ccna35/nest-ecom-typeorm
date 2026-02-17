import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerProfilesController } from './seller-profiles.controller';
import { SellerProfilesService } from './seller-profiles.service';
import { SellerProfile } from './seller-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SellerProfile])],
  controllers: [SellerProfilesController],
  providers: [SellerProfilesService],
  exports: [SellerProfilesService],
})
export class SellerProfilesModule {}
