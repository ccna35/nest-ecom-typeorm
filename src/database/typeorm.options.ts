import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Category } from '../modules/categories/category.entity';
import { Product } from '../modules/products/product.entity';
import dataSource from './data-source';

export const typeOrmOptions: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService): DataSourceOptions => {
    const sslEnabled = config.get<string>('DB_SSL') === 'true';
    const dbHost = config.get<string>('DB_HOST') || 'localhost';
    const dbPort = config.get<string>('DB_PORT') || '5432';
    const dbUser = config.get<string>('DB_USER') || 'postgres';
    const dbPassword = config.get<string>('DB_PASSWORD') || 'postgres';
    const dbName = config.get<string>('DB_NAME') || 'ecom';
    const fallbackUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    const databaseUrl = config.get<string>('DATABASE_URL') || fallbackUrl;

    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [User, Category, Product],
      migrations: dataSource.options.migrations,
      synchronize: config.get<string>('NODE_ENV') !== 'production',
      logging: config.get<string>('NODE_ENV') === 'development',
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    };
  },
};
