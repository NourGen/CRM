import { Student } from './student.entity';
import { Round } from './round.entity';
export declare class AcademyFinalProject {
    id: string;
    legacyId: string;
    studentLegacyId: string;
    student: Student;
    studentName: string;
    roundLegacyId: string;
    round: Round;
    driveFileId: string;
    fileName: string;
    submittedAt: Date;
    status: string;
    reviewNotes: string;
    reviewedBy: string;
    reviewedAt: Date;
    outlineFileId: string;
    outlineFileName: string;
}
