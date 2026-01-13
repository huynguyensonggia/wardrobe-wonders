import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

// Default configuration for the database connection
export const databaseConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wardrobe-wonders',
  synchronize: false,
  logging: process.env.APP_DEBUG == 'true',
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['database/migrations/**/*.ts'],
  subscribers: [],
};

export const typeOrmNestConfig = {
  ...databaseConfig,
  autoLoadEntities: true,
};

export const AppDataSource = new DataSource(databaseConfig);

export default typeOrmNestConfig;