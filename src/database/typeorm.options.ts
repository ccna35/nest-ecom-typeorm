import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Category } from '../modules/categories/category.entity';
import { Product } from '../modules/products/product.entity';

export const typeOrmOptions: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService): DataSourceOptions => {
    const sslEnabled = config.get<string>('DB_SSL') === 'true';

    return {
      type: 'postgres',
      url: config.get<string>('DATABASE_URL'),
      entities: [User, Category, Product],
      synchronize: config.get<string>('NODE_ENV') !== 'production',
      logging: config.get<string>('NODE_ENV') === 'development',
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
      migrationsRun: config.get<string>('NODE_ENV') === 'production',
    };
  },
};
