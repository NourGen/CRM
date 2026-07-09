import { Repository } from 'typeorm';
import { AcademyLedger } from './entities/academy-ledger.entity';
import { ClientPayment } from './entities/client-payment.entity';
import { CreateAcademyLedgerDto, CreateClientPaymentDto } from './dto/financial.dto';
export declare class FinancialService {
    private readonly academyLedgerRepository;
    private readonly clientPaymentRepository;
    constructor(academyLedgerRepository: Repository<AcademyLedger>, clientPaymentRepository: Repository<ClientPayment>);
    createAcademyLedger(dto: CreateAcademyLedgerDto): Promise<AcademyLedger>;
    findAllAcademyLedgers(): Promise<AcademyLedger[]>;
    findAcademyLedgerById(id: string): Promise<AcademyLedger>;
    createClientPayment(dto: CreateClientPaymentDto): Promise<ClientPayment>;
    findAllClientPayments(): Promise<ClientPayment[]>;
    findClientPaymentById(id: string): Promise<ClientPayment>;
}
