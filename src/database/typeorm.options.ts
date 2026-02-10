import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Category } from '../modules/categories/category.entity';
import { Product } from '../modules/products/product.entity';
import dataSource from './data-source';

export const typeOrmOptions: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  // useFactory: (config: ConfigService) => ({
  //       ...dataSource.options,               // ← reuse the exact same config!
  //       url: config.get<string>('DATABASE_URL'),  // ensure it's set
  //       // override only if needed (e.g. extra logging)
  //     })
  useFactory: (config: ConfigService): DataSourceOptions => {
    const sslEnabled = config.get<string>('DB_SSL') === 'true';

    console.log('TypeORM Config:');
    console.log({
      type: 'postgres',
      url: config.get<string>('DATABASE_URL'),
      entities: [User, Category, Product],
      synchronize: config.get<string>('NODE_ENV') !== 'production',
      logging: config.get<string>('NODE_ENV') === 'development',
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    });

    return {
      ...dataSource.options
      // type: 'postgres',
      // url: config.get<string>('DATABASE_URL'),
      // entities: [User, Category, Product],
      // synchronize: config.get<string>('NODE_ENV') !== 'production',
      // logging: config.get<string>('NODE_ENV') === 'development',
      // ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    };
  },
};
