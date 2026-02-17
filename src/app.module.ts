import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from './database/typeorm.options';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SellerProfilesModule } from './modules/seller-profiles/seller-profiles.module';
import { SellerApplicationsModule } from './modules/seller-applications/seller-applications.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeOrmOptions),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    CategoriesModule,
    ProductsModule,
    AuthModule,
    SellerProfilesModule,
    SellerApplicationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
