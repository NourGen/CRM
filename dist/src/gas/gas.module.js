"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const gas_controller_1 = require("./gas.controller");
const gas_service_1 = require("./gas.service");
const user_entity_1 = require("../sales/entities/user.entity");
const my_lead_entity_1 = require("../sales/entities/my-lead.entity");
const raw_lead_entity_1 = require("../sales/entities/raw-lead.entity");
const lead_call_log_entity_1 = require("../sales/entities/lead-call-log.entity");
const support_request_entity_1 = require("../sales/entities/support-request.entity");
const exception_request_entity_1 = require("../sales/entities/exception-request.entity");
const task_entity_1 = require("../sales/entities/task.entity");
const round_entity_1 = require("../academy/entities/round.entity");
const round_member_entity_1 = require("../academy/entities/round-member.entity");
const instructor_entity_1 = require("../academy/entities/instructor.entity");
const academy_ledger_entity_1 = require("../financial/entities/academy-ledger.entity");
const course_entity_1 = require("../financial/entities/course.entity");
const offer_entity_1 = require("../financial/entities/offer.entity");
const client_payment_entity_1 = require("../financial/entities/client-payment.entity");
const financial_data_entity_1 = require("../financial/entities/financial-data.entity");
const payment_transaction_entity_1 = require("../financial/entities/payment-transaction.entity");
let GasModule = class GasModule {
};
exports.GasModule = GasModule;
exports.GasModule = GasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                my_lead_entity_1.MyLead,
                raw_lead_entity_1.RawLead,
                lead_call_log_entity_1.LeadCallLog,
                support_request_entity_1.SupportRequest,
                exception_request_entity_1.ExceptionRequest,
                task_entity_1.Task,
                round_entity_1.Round,
                academy_ledger_entity_1.AcademyLedger,
                course_entity_1.Course,
                offer_entity_1.Offer,
                client_payment_entity_1.ClientPayment,
                instructor_entity_1.Instructor,
                round_member_entity_1.RoundMember,
                financial_data_entity_1.FinancialData,
                payment_transaction_entity_1.PaymentTransaction,
            ]),
        ],
        controllers: [gas_controller_1.GasController],
        providers: [gas_service_1.GasService],
    })
], GasModule);
//# sourceMappingURL=gas.module.js.map