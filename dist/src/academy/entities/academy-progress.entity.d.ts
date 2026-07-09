import { Student } from './student.entity';
import { AcademyContent } from './academy-content.entity';
export declare class AcademyProgress {
    id: string;
    legacyId: string;
    studentLegacyId: string;
    student: Student;
    lectureLegacyId: string;
    lecture: AcademyContent;
    watchedAt: Date;
    completed: boolean;
}
