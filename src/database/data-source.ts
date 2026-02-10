import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Category } from '../modules/categories/category.entity';
import { Product } from '../modules/products/product.entity';

export default new DataSource({
  type: 'postgres',

  // ── Single source of truth ──
  url: process.env.DATABASE_URL,  // Railway injects this; local .env provides it too

  // Optional: fallback only for safety (but better to require it in prod)
  // if (!process.env.DATABASE_URL) {
  //   throw new Error('DATABASE_URL is required in environment');
  // }

  entities: [User, Category, Product],

  // Migrations point to compiled files (after build)
  migrations: ['dist/database/migrations/*.js'],

  synchronize: false,  // NEVER true in prod

  // Railway-specific (self-signed certs)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,

  logging: process.env.NODE_ENV === 'development' ? 'all' : ['error'],
});