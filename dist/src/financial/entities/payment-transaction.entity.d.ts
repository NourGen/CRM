import { ClientPayment } from './client-payment.entity';
import { User } from '../../sales/entities/user.entity';
export declare class PaymentTransaction {
    id: string;
    legacyTransactionId: string;
    legacyPaymentId: string;
    payment: ClientPayment;
    clientName: string;
    amount: number;
    date: Date;
    type: string;
    agentLegacyId: string;
    agent: User;
    agentName: string;
}
