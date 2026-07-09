import { FinancialService } from './financial.service';
import { CreateAcademyLedgerDto, CreateClientPaymentDto } from './dto/financial.dto';
export declare class FinancialController {
    private readonly financialService;
    constructor(financialService: FinancialService);
    createAcademyLedger(dto: CreateAcademyLedgerDto): Promise<import("./entities/academy-ledger.entity").AcademyLedger>;
    findAllAcademyLedgers(): Promise<import("./entities/academy-ledger.entity").AcademyLedger[]>;
    findAcademyLedgerById(id: string): Promise<import("./entities/academy-ledger.entity").AcademyLedger>;
    createClientPayment(dto: CreateClientPaymentDto): Promise<import("./entities/client-payment.entity").ClientPayment>;
    findAllClientPayments(): Promise<import("./entities/client-payment.entity").ClientPayment[]>;
    findClientPaymentById(id: string): Promise<import("./entities/client-payment.entity").ClientPayment>;
}
