import { Student } from './student.entity';
import { Round } from './round.entity';
import { AcademyContent } from './academy-content.entity';
export declare class AcademyTask {
    id: string;
    legacyId: string;
    studentLegacyId: string;
    student: Student;
    studentName: string;
    roundLegacyId: string;
    round: Round;
    lectureLegacyId: string;
    lecture: AcademyContent;
    lectureName: string;
    driveFileId: string;
    fileName: string;
    submittedAt: Date;
    status: string;
    reviewedAt: Date;
    reviewedBy: string;
    reviewNotes: string;
}
