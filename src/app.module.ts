import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesModule } from './sales/sales.module';
import { AcademyModule } from './academy/academy.module';
import { FinancialModule } from './financial/financial.module';
import { GasModule } from './gas/gas.module';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bsa_crm',
      autoLoadEntities: true,
      synchronize: !isProduction, // false in production
      charset: 'utf8mb4',
    }),
    SalesModule,
    AcademyModule,
    FinancialModule,
    GasModule,
  ],
})
export class AppModule {}
