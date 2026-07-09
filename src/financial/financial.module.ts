import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademyLedger } from './entities/academy-ledger.entity';
import { Installment } from './entities/installment.entity';
import { ClientPayment } from './entities/client-payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { FinancialData } from './entities/financial-data.entity';
import { LecturerSalary } from './entities/lecturer-salary.entity';
import { Expense } from './entities/expense.entity';
import { WalletIncome } from './entities/wallet-income.entity';
import { WalletAdjustment } from './entities/wallet-adjustment.entity';
import { WalletTransfer } from './entities/wallet-transfer.entity';
import { Offer } from './entities/offer.entity';
import { Course } from './entities/course.entity';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademyLedger,
      Installment,
      ClientPayment,
      PaymentTransaction,
      FinancialData,
      LecturerSalary,
      Expense,
      WalletIncome,
      WalletAdjustment,
      WalletTransfer,
      Offer,
      Course,
    ]),
  ],
  providers: [FinancialService],
  controllers: [FinancialController],
  exports: [TypeOrmModule, FinancialService],
})
export class FinancialModule {}
