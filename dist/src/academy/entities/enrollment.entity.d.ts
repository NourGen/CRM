import { Student } from './student.entity';
import { Round } from './round.entity';
export declare class Enrollment {
    id: string;
    legacyId: string;
    studentLegacyId: string;
    student: Student;
    roundLegacyId: string;
    round: Round;
    roundName: string;
    enrolledAt: Date;
    status: string;
}
