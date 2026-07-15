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
import { Student } from '../academy/entities/student.entity';
import { AcademySession } from '../academy/entities/academy-session.entity';
import { FreshLead } from '../sales/entities/fresh-lead.entity';
import { ActivityLog } from '../sales/entities/activity-log.entity';
import { LecturerSalary } from '../financial/entities/lecturer-salary.entity';
import { Enrollment } from '../academy/entities/enrollment.entity';
import { SystemSetting } from '../sales/entities/system-setting.entity';
import { AttendanceRecord } from '../academy/entities/attendance-record.entity';
import { Celebration } from '../sales/entities/celebration.entity';
import { Expense } from '../financial/entities/expense.entity';
import { BreakLog } from '../sales/entities/break-log.entity';
import { AcademySupportFile } from '../academy/entities/academy-support-file.entity';
import { AcademyContent } from '../academy/entities/academy-content.entity';
import { AcademyQuiz } from '../academy/entities/academy-quiz.entity';
import { QuizBank } from '../academy/entities/quiz-bank.entity';
import { AcademyTask } from '../academy/entities/academy-task.entity';
import { AcademyUnlock } from '../academy/entities/academy-unlock.entity';
import { AcademyProgress } from '../academy/entities/academy-progress.entity';
import { QuizResult } from '../academy/entities/quiz-result.entity';
import { AcademySupport } from '../academy/entities/academy-support.entity';
import { AcademyNotification } from '../academy/entities/academy-notification.entity';
import { AcademyPost } from '../academy/entities/academy-post.entity';
import { AcademyDM } from '../academy/entities/academy-dm.entity';
import { AcademyFriend } from '../academy/entities/academy-friend.entity';
import { AcademyReaction } from '../academy/entities/academy-reaction.entity';
import { QuizAttempt } from '../academy/entities/quiz-attempt.entity';
import { LiveSession } from '../academy/entities/live-session.entity';
import { AcademyFinalProject } from '../academy/entities/academy-final-project.entity';
import { SuccessStory } from '../academy/entities/success-story.entity';
import { ShowcaseProject } from '../academy/entities/showcase-project.entity';
import { BsaOrientation } from '../academy/entities/bsa-orientation.entity';
import { WalletIncome } from '../financial/entities/wallet-income.entity';
import { WalletAdjustment } from '../financial/entities/wallet-adjustment.entity';
import { WalletTransfer } from '../financial/entities/wallet-transfer.entity';
import { AcademySurveyResponse } from '../academy/entities/academy-survey-response.entity';

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
      Student,
      AcademySession,
      FreshLead,
      ActivityLog,
      LecturerSalary,
      Enrollment,
      SystemSetting,
      AttendanceRecord,
      Celebration,
      Expense,
      BreakLog,
      AcademySupportFile,
      AcademyContent,
      AcademyQuiz,
      QuizBank,
      AcademyTask,
      AcademyUnlock,
      AcademyProgress,
      QuizResult,
      AcademySupport,
      AcademyNotification,
      AcademyPost,
      AcademyDM,
      AcademyFriend,
      AcademyReaction,
      QuizAttempt,
      LiveSession,
      AcademyFinalProject,
      SuccessStory,
      ShowcaseProject,
      WalletIncome,
      WalletAdjustment,
      WalletTransfer,
      AcademySurveyResponse,
      BsaOrientation,
    ]),
  ],
  controllers: [GasController],
  providers: [GasService],
})
export class GasModule {}
