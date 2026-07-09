import { Student } from './student.entity';
import { AcademyContent } from './academy-content.entity';
export declare class QuizResult {
    id: string;
    legacyId: string;
    studentLegacyId: string;
    student: Student;
    lectureLegacyId: string;
    lecture: AcademyContent;
    score: number;
    passed: boolean;
    attemptAt: Date;
    totalQ: number;
    correctQ: number;
}
