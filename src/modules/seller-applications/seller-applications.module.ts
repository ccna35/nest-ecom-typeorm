import { Module } from '@nestjs/common';
import { SellerApplicationsController } from './seller-applications.controller';
import { SellerApplicationsService } from './seller-applications.service';
import { UsersModule } from '../users/users.module';
import { SellerProfilesModule } from '../seller-profiles/seller-profiles.module';

@Module({
  imports: [UsersModule, SellerProfilesModule],
  controllers: [SellerApplicationsController],
  providers: [SellerApplicationsService],
  exports: [SellerApplicationsService],
})
export class SellerApplicationsModule {}
