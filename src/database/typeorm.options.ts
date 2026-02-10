import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import dataSource from './data-source';

export const typeOrmOptions: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    ...dataSource.options,
    url: config.get<string>('DATABASE_URL'), // ensure it's set
    // override only if needed (e.g. extra logging)
  })
};
