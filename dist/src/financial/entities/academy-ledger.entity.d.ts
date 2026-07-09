import { Installment } from './installment.entity';
export declare class AcademyLedger {
    id: string;
    bookingDate: Date;
    ocCode: string;
    clientName: string;
    phone: string;
    course: string;
    groupName: string;
    status: string;
    totalPrice: number;
    paymentMethod: string;
    amountPaid: number;
    amountRemaining: number;
    salesAgentEmail: string;
    installments: Installment[];
}
