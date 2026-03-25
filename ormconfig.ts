import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

// Render inject env vars trực tiếp, không cần file .env
// dotenv/config sẽ tự bỏ qua nếu không tìm thấy file .env

const isProd = process.env.NODE_ENV === 'production';

// Debug: log để kiểm tra env vars có được đọc không
console.log('[ormconfig] DB_HOST:', process.env.DB_HOST);
console.log('[ormconfig] NODE_ENV:', process.env.NODE_ENV);

export const databaseConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wardrobe-wonders',
  synchronize: false,
  logging: process.env.APP_DEBUG === 'true',
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
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