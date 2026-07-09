"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const academy_ledger_entity_1 = require("./entities/academy-ledger.entity");
const client_payment_entity_1 = require("./entities/client-payment.entity");
let FinancialService = class FinancialService {
    academyLedgerRepository;
    clientPaymentRepository;
    constructor(academyLedgerRepository, clientPaymentRepository) {
        this.academyLedgerRepository = academyLedgerRepository;
        this.clientPaymentRepository = clientPaymentRepository;
    }
    async createAcademyLedger(dto) {
        const ledger = this.academyLedgerRepository.create(dto);
        return this.academyLedgerRepository.save(ledger);
    }
    async findAllAcademyLedgers() {
        return this.academyLedgerRepository.find({ relations: { installments: true } });
    }
    async findAcademyLedgerById(id) {
        const ledger = await this.academyLedgerRepository.findOne({ where: { id }, relations: { installments: true } });
        if (!ledger)
            throw new common_1.NotFoundException('Academy ledger record not found');
        return ledger;
    }
    async createClientPayment(dto) {
        const payment = this.clientPaymentRepository.create(dto);
        return this.clientPaymentRepository.save(payment);
    }
    async findAllClientPayments() {
        return this.clientPaymentRepository.find({ relations: { agent: true, round: true } });
    }
    async findClientPaymentById(id) {
        const payment = await this.clientPaymentRepository.findOne({ where: { id }, relations: { agent: true, round: true } });
        if (!payment)
            throw new common_1.NotFoundException('Client payment record not found');
        return payment;
    }
};
exports.FinancialService = FinancialService;
exports.FinancialService = FinancialService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(academy_ledger_entity_1.AcademyLedger)),
    __param(1, (0, typeorm_1.InjectRepository)(client_payment_entity_1.ClientPayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FinancialService);
//# sourceMappingURL=financial.service.js.map