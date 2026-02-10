import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Category } from '../modules/categories/category.entity';
import { Product } from '../modules/products/product.entity';

// NOTE: TypeORM CLI reads env vars from process.env.
// Run with: `cp .env.example .env` then `npm run migration:generate`.

export default new DataSource({
  type: 'postgres',
  // host: process.env.DB_HOST ?? 'localhost',
  // port: Number(process.env.DB_PORT ?? '5432'),
  // username: process.env.DB_USER ?? 'postgres',
  // password: process.env.DB_PASSWORD ?? 'postgres',
  // database: process.env.DB_NAME ?? 'ecom',
  entities: [User, Category, Product],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
});
