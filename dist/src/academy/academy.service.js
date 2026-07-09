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
exports.AcademyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("./entities/student.entity");
const instructor_entity_1 = require("./entities/instructor.entity");
const round_entity_1 = require("./entities/round.entity");
const bcrypt = __importStar(require("bcrypt"));
let AcademyService = class AcademyService {
    studentRepository;
    instructorRepository;
    roundRepository;
    constructor(studentRepository, instructorRepository, roundRepository) {
        this.studentRepository = studentRepository;
        this.instructorRepository = instructorRepository;
        this.roundRepository = roundRepository;
    }
    async createStudent(dto) {
        const student = new student_entity_1.Student();
        Object.assign(student, dto);
        if (dto.password) {
            student.password = await bcrypt.hash(dto.password, 10);
        }
        return this.studentRepository.save(student);
    }
    async findAllStudents() {
        return this.studentRepository.find();
    }
    async findStudentById(id) {
        const student = await this.studentRepository.findOne({ where: { id } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        return student;
    }
    async createInstructor(dto) {
        const instructor = new instructor_entity_1.Instructor();
        Object.assign(instructor, dto);
        if (dto.password) {
            instructor.password = await bcrypt.hash(dto.password, 10);
        }
        return this.instructorRepository.save(instructor);
    }
    async findAllInstructors() {
        return this.instructorRepository.find();
    }
    async findInstructorById(id) {
        const instructor = await this.instructorRepository.findOne({ where: { id } });
        if (!instructor)
            throw new common_1.NotFoundException('Instructor not found');
        return instructor;
    }
    async createRound(dto) {
        const round = this.roundRepository.create(dto);
        return this.roundRepository.save(round);
    }
    async findAllRounds() {
        return this.roundRepository.find();
    }
    async findRoundById(id) {
        const round = await this.roundRepository.findOne({ where: { id } });
        if (!round)
            throw new common_1.NotFoundException('Round not found');
        return round;
    }
};
exports.AcademyService = AcademyService;
exports.AcademyService = AcademyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(instructor_entity_1.Instructor)),
    __param(2, (0, typeorm_1.InjectRepository)(round_entity_1.Round)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AcademyService);
//# sourceMappingURL=academy.service.js.map