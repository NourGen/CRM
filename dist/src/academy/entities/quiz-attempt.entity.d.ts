import { Student } from './student.entity';
import { AcademyContent } from './academy-content.entity';
export declare class QuizAttempt {
    attemptId: string;
    legacyAttemptId: string;
    studentLegacyId: string;
    student: Student;
    lectureLegacyId: string;
    lecture: AcademyContent;
    questionsJson: any;
    createdAt: Date;
    status: string;
}
