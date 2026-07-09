import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GasController } from './gas.controller';
import { GasService } from './gas.service';
import { User } from '../sales/entities/user.entity';
import { MyLead } from '../sales/entities/my-lead.entity';
import { RawLead } from '../sales/entities/raw-lead.entity';
import { LeadCallLog } from '../sales/entities/lead-call-log.entity';
import { SupportRequest } from '../sales/entities/support-request.entity';
import { ExceptionRequest } from '../sales/entities/exception-request.entity';
import { Task } from '../sales/entities/task.entity';
import { Round } from '../academy/entities/round.entity';
import { RoundMember } from '../academy/entities/round-member.entity';
import { Instructor } from '../academy/entities/instructor.entity';
import { AcademyLedger } from '../financial/entities/academy-ledger.entity';
import { Course } from '../financial/entities/course.entity';
import { Offer } from '../financial/entities/offer.entity';
import { ClientPayment } from '../financial/entities/client-payment.entity';
import { FinancialData } from '../financial/entities/financial-data.entity';
import { PaymentTransaction } from '../financial/entities/payment-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MyLead,
      RawLead,
      LeadCallLog,
      SupportRequest,
      ExceptionRequest,
      Task,
      Round,
      AcademyLedger,
      Course,
      Offer,
      ClientPayment,
      Instructor,
      RoundMember,
      FinancialData,
      PaymentTransaction,
    ]),
  ],
  controllers: [GasController],
  providers: [GasService],
})
export class GasModule {}
