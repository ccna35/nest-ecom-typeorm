import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerApplicationsController } from './seller-applications.controller';
import { SellerApplicationsService } from './seller-applications.service';
import { SellerApplication } from './seller-application.entity';
import { UsersModule } from '../users/users.module';
import { SellerProfilesModule } from '../seller-profiles/seller-profiles.module';

@Module({
  imports: [TypeOrmModule.forFeature([SellerApplication]), UsersModule, SellerProfilesModule],
  controllers: [SellerApplicationsController],
  providers: [SellerApplicationsService],
  exports: [SellerApplicationsService],
})
export class SellerApplicationsModule {}
