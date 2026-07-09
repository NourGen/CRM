import { Controller, Get, Body, Post, Param } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CreateAcademyLedgerDto, CreateClientPaymentDto } from './dto/financial.dto';

@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('ledger')
  createAcademyLedger(@Body() dto: CreateAcademyLedgerDto) {
    return this.financialService.createAcademyLedger(dto);
  }

  @Get('ledger')
  findAllAcademyLedgers() {
    return this.financialService.findAllAcademyLedgers();
  }

  @Get('ledger/:id')
  findAcademyLedgerById(@Param('id') id: string) {
    return this.financialService.findAcademyLedgerById(id);
  }

  @Post('payments')
  createClientPayment(@Body() dto: CreateClientPaymentDto) {
    return this.financialService.createClientPayment(dto);
  }

  @Get('payments')
  findAllClientPayments() {
    return this.financialService.findAllClientPayments();
  }

  @Get('payments/:id')
  findClientPaymentById(@Param('id') id: string) {
    return this.financialService.findClientPaymentById(id);
  }
}
