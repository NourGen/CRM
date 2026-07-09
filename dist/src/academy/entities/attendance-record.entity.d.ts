import { Round } from './round.entity';
export declare class AttendanceRecord {
    id: string;
    roundLegacyId: string;
    round: Round;
    studentPhone: string;
    studentName: string;
    attendedList: string[];
    tasksList: string[];
    lastUpdated: Date;
}
