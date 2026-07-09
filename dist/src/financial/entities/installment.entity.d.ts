import { AcademyLedger } from './academy-ledger.entity';
export declare class Installment {
    id: string;
    ledger: AcademyLedger;
    amount: number;
    dueDate: Date;
    paymentMethod: string;
    status: string;
    installmentOrder: number;
}
