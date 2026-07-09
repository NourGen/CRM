"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const raw_lead_entity_1 = require("./entities/raw-lead.entity");
const my_lead_entity_1 = require("./entities/my-lead.entity");
const lead_call_log_entity_1 = require("./entities/lead-call-log.entity");
const exception_request_entity_1 = require("./entities/exception-request.entity");
const support_request_entity_1 = require("./entities/support-request.entity");
const break_log_entity_1 = require("./entities/break-log.entity");
const celebration_entity_1 = require("./entities/celebration.entity");
const task_entity_1 = require("./entities/task.entity");
const activity_log_entity_1 = require("./entities/activity-log.entity");
const sales_service_1 = require("./sales.service");
const sales_controller_1 = require("./sales.controller");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                raw_lead_entity_1.RawLead,
                my_lead_entity_1.MyLead,
                lead_call_log_entity_1.LeadCallLog,
                exception_request_entity_1.ExceptionRequest,
                support_request_entity_1.SupportRequest,
                break_log_entity_1.BreakLog,
                celebration_entity_1.Celebration,
                task_entity_1.Task,
                activity_log_entity_1.ActivityLog,
            ]),
        ],
        providers: [sales_service_1.SalesService],
        controllers: [sales_controller_1.SalesController],
        exports: [typeorm_1.TypeOrmModule, sales_service_1.SalesService],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map