import { User } from '../../sales/entities/user.entity';
import { Round } from '../../academy/entities/round.entity';
export declare class ClientPayment {
    id: string;
    legacyId: string;
    agentLegacyId: string;
    agent: User;
    clientLegacyId: string;
    clientName: string;
    course: string;
    roundLegacyId: string;
    round: Round;
    roundName: string;
    totalAmount: number;
    agentUsername: string;
    amountPaid: number;
    amountUnpaid: number;
    paymentTime: Date;
    status: string;
    notes: string;
    createdAt: Date;
    amountDetail1: number;
    amountDetail2: number;
    amountDetail3: number;
    lastModified: Date;
    isDeleted: boolean;
    deletedBy: string;
    deletedAt: Date;
}
