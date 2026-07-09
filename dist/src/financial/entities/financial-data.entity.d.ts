import { User } from '../../sales/entities/user.entity';
export declare class FinancialData {
    id: string;
    agentLegacyId: string;
    agent: User;
    agentName: string;
    month: number;
    year: number;
    type: string;
    action: string;
    ocCode: string;
    clientName: string;
    phone: string;
    course: string;
    reservation: Date;
    attendance: Date;
    paymentMethod: string;
    offer: string;
    price: number;
    paid: number;
    createdAt: Date;
    clientType: string;
    campaignType: string;
}
