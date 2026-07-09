import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademyLedger } from './entities/academy-ledger.entity';
import { ClientPayment } from './entities/client-payment.entity';
import { CreateAcademyLedgerDto, CreateClientPaymentDto } from './dto/financial.dto';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(AcademyLedger)
    private readonly academyLedgerRepository: Repository<AcademyLedger>,
    @InjectRepository(ClientPayment)
    private readonly clientPaymentRepository: Repository<ClientPayment>,
  ) {}

  // ACADEMY LEDGER CRUD
  async createAcademyLedger(dto: CreateAcademyLedgerDto): Promise<AcademyLedger> {
    const ledger = this.academyLedgerRepository.create(dto);
    return this.academyLedgerRepository.save(ledger);
  }

  async findAllAcademyLedgers(): Promise<AcademyLedger[]> {
    return this.academyLedgerRepository.find({ relations: { installments: true } });
  }

  async findAcademyLedgerById(id: string): Promise<AcademyLedger> {
    const ledger = await this.academyLedgerRepository.findOne({ where: { id }, relations: { installments: true } });
    if (!ledger) throw new NotFoundException('Academy ledger record not found');
    return ledger;
  }

  // CLIENT PAYMENT CRUD
  async createClientPayment(dto: CreateClientPaymentDto): Promise<ClientPayment> {
    const payment = this.clientPaymentRepository.create(dto);
    return this.clientPaymentRepository.save(payment);
  }

  async findAllClientPayments(): Promise<ClientPayment[]> {
    return this.clientPaymentRepository.find({ relations: { agent: true, round: true } });
  }

  async findClientPaymentById(id: string): Promise<ClientPayment> {
    const payment = await this.clientPaymentRepository.findOne({ where: { id }, relations: { agent: true, round: true } });
    if (!payment) throw new NotFoundException('Client payment record not found');
    return payment;
  }
}
