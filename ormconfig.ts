import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';

export const databaseConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wardrobe-wonders',
  synchronize: false,
  logging: process.env.APP_DEBUG === 'true',
  entities: isProd
    ? [path.join(__dirname, 'src/modules/**/*.entity.js')]
    : [path.join(__dirname, 'src/modules/**/*.entity.ts')],
  migrations: isProd
    ? [path.join(__dirname, 'database/migrations/**/*.js')]
    : [path.join(__dirname, 'database/migrations/**/*.ts')],
  subscribers: [],
};

export const typeOrmNestConfig = {
  ...databaseConfig,
  autoLoadEntities: true,
};

export const AppDataSource = new DataSource(databaseConfig);

export default typeOrmNestConfig;