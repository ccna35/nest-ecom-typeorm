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
      host: config.get<string>('DB_HOST', 'localhost'),
      port: Number(config.get<string>('DB_PORT', '5432')),
      username: config.get<string>('DB_USER', 'postgres'),
      password: config.get<string>('DB_PASSWORD', 'postgres'),
      database: config.get<string>('DB_NAME', 'ecom'),
      entities: [User, Category, Product],
      synchronize: config.get<string>('TYPEORM_SYNC', 'true') === 'true',
      logging: config.get<string>('TYPEORM_LOGGING', 'false') === 'true',
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    };
  },
};
