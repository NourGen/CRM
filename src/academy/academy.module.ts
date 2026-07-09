import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Instructor } from './entities/instructor.entity';
import { Round } from './entities/round.entity';
import { RoundMember } from './entities/round-member.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { Enrollment } from './entities/enrollment.entity';
import { AcademyContent } from './entities/academy-content.entity';
import { AcademyProgress } from './entities/academy-progress.entity';
import { AcademyTask } from './entities/academy-task.entity';
import { AcademyFinalProject } from './entities/academy-final-project.entity';
import { AcademyQuiz } from './entities/academy-quiz.entity';
import { QuizBank } from './entities/quiz-bank.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { QuizResult } from './entities/quiz-result.entity';
import { LiveSession } from './entities/live-session.entity';
import { AcademySupport } from './entities/academy-support.entity';
import { AcademySupportFile } from './entities/academy-support-file.entity';
import { AcademyPost } from './entities/academy-post.entity';
import { AcademyReaction } from './entities/academy-reaction.entity';
import { AcademyDM } from './entities/academy-dm.entity';
import { AcademyNotification } from './entities/academy-notification.entity';
import { AcademyFriend } from './entities/academy-friend.entity';
import { SuccessStory } from './entities/success-story.entity';
import { ShowcaseProject } from './entities/showcase-project.entity';
import { AcademyService } from './academy.service';
import { AcademyController } from './academy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Instructor,
      Round,
      RoundMember,
      AttendanceRecord,
      Enrollment,
      AcademyContent,
      AcademyProgress,
      AcademyTask,
      AcademyFinalProject,
      AcademyQuiz,
      QuizBank,
      QuizAttempt,
      QuizResult,
      LiveSession,
      AcademySupport,
      AcademySupportFile,
      AcademyPost,
      AcademyReaction,
      AcademyDM,
      AcademyNotification,
      AcademyFriend,
      SuccessStory,
      ShowcaseProject,
    ]),
  ],
  providers: [AcademyService],
  controllers: [AcademyController],
  exports: [TypeOrmModule, AcademyService],
})
export class AcademyModule {}
