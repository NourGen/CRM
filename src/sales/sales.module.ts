import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RawLead } from './entities/raw-lead.entity';
import { MyLead } from './entities/my-lead.entity';
import { LeadCallLog } from './entities/lead-call-log.entity';
import { ExceptionRequest } from './entities/exception-request.entity';
import { SupportRequest } from './entities/support-request.entity';
import { BreakLog } from './entities/break-log.entity';
import { Celebration } from './entities/celebration.entity';
import { Task } from './entities/task.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RawLead,
      MyLead,
      LeadCallLog,
      ExceptionRequest,
      SupportRequest,
      BreakLog,
      Celebration,
      Task,
      ActivityLog,
    ]),
  ],
  providers: [SalesService],
  controllers: [SalesController],
  exports: [TypeOrmModule, SalesService],
})
export class SalesModule {}
