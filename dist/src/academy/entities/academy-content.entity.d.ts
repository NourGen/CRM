import { Round } from './round.entity';
export declare class AcademyContent {
    id: string;
    legacyId: string;
    roundLegacyId: string;
    round: Round;
    roundName: string;
    lectureOrder: number;
    lectureName: string;
    driveFileId: string;
    fileType: string;
    isLocked: boolean;
    taskRequired: boolean;
    notes: string;
    createdAt: Date;
}
