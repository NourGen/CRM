"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const raw_lead_entity_1 = require("./entities/raw-lead.entity");
const my_lead_entity_1 = require("./entities/my-lead.entity");
const bcrypt = __importStar(require("bcrypt"));
let SalesService = class SalesService {
    userRepository;
    rawLeadRepository;
    myLeadRepository;
    constructor(userRepository, rawLeadRepository, myLeadRepository) {
        this.userRepository = userRepository;
        this.rawLeadRepository = rawLeadRepository;
        this.myLeadRepository = myLeadRepository;
    }
    async createUser(dto) {
        const user = new user_entity_1.User();
        Object.assign(user, dto);
        if (dto.password) {
            user.password = await bcrypt.hash(dto.password, 10);
        }
        else {
            user.password = await bcrypt.hash('defaultPassword123', 10);
        }
        return this.userRepository.save(user);
    }
    async findAllUsers() {
        return this.userRepository.find();
    }
    async findUserById(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async createRawLead(dto) {
        const lead = this.rawLeadRepository.create(dto);
        return this.rawLeadRepository.save(lead);
    }
    async findAllRawLeads() {
        return this.rawLeadRepository.find({ relations: { agent: true } });
    }
    async findRawLeadById(id) {
        const lead = await this.rawLeadRepository.findOne({ where: { id }, relations: { agent: true } });
        if (!lead)
            throw new common_1.NotFoundException('Raw lead not found');
        return lead;
    }
    async createMyLead(dto) {
        const lead = this.myLeadRepository.create(dto);
        return this.myLeadRepository.save(lead);
    }
    async findAllMyLeads() {
        return this.myLeadRepository.find({ relations: { agent: true, callLogs: true } });
    }
    async findMyLeadById(id) {
        const lead = await this.myLeadRepository.findOne({ where: { id }, relations: { agent: true, callLogs: true } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return lead;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(raw_lead_entity_1.RawLead)),
    __param(2, (0, typeorm_1.InjectRepository)(my_lead_entity_1.MyLead)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SalesService);
//# sourceMappingURL=sales.service.js.map