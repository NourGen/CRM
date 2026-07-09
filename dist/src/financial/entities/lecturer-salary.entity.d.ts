import { Round } from '../../academy/entities/round.entity';
export declare class LecturerSalary {
    id: string;
    legacyId: string;
    roundLegacyId: string;
    round: Round;
    roundName: string;
    roundType: string;
    instructorName: string;
    pay1Amount: number;
    pay1Status: string;
    pay1PaidDate: Date;
    pay2Amount: number;
    pay2Status: string;
    pay2PaidDate: Date;
    alert1Triggered: boolean;
    alert2Triggered: boolean;
    notes: string;
    createdAt: Date;
}
