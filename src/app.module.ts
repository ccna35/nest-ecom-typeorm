import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from './database/typeorm.options';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeOrmOptions),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    CategoriesModule,
    ProductsModule,
  ],
})

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? process.env.PGHOST,
      port: Number(process.env.DB_PORT ?? process.env.PGPORT ?? 5432),
      username: process.env.DB_USER ?? process.env.PGUSER,
      password: process.env.DB_PASSWORD ?? process.env.PGPASSWORD,
      database: process.env.DB_NAME ?? process.env.PGDATABASE,

      // IMPORTANT for prod:
      autoLoadEntities: true,
      synchronize: false, // recommended: use migrations instead
      ssl: (process.env.DB_SSL ?? 'true') === 'true'
        ? { rejectUnauthorized: false }
        : false,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    CategoriesModule,
    ProductsModule,
  ],
})
export class AppModule { }
