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
exports.AcademyController = void 0;
const common_1 = require("@nestjs/common");
const academy_service_1 = require("./academy.service");
const academy_dto_1 = require("./dto/academy.dto");
let AcademyController = class AcademyController {
    academyService;
    constructor(academyService) {
        this.academyService = academyService;
    }
    createStudent(dto) {
        return this.academyService.createStudent(dto);
    }
    findAllStudents() {
        return this.academyService.findAllStudents();
    }
    findStudentById(id) {
        return this.academyService.findStudentById(id);
    }
    createInstructor(dto) {
        return this.academyService.createInstructor(dto);
    }
    findAllInstructors() {
        return this.academyService.findAllInstructors();
    }
    findInstructorById(id) {
        return this.academyService.findInstructorById(id);
    }
    createRound(dto) {
        return this.academyService.createRound(dto);
    }
    findAllRounds() {
        return this.academyService.findAllRounds();
    }
    findRoundById(id) {
        return this.academyService.findRoundById(id);
    }
};
exports.AcademyController = AcademyController;
__decorate([
    (0, common_1.Post)('students'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [academy_dto_1.CreateStudentDto]),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Get)('students'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "findAllStudents", null);
__decorate([
    (0, common_1.Get)('students/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "findStudentById", null);
__decorate([
    (0, common_1.Post)('instructors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [academy_dto_1.CreateInstructorDto]),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "createInstructor", null);
__decorate([
    (0, common_1.Get)('instructors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "findAllInstructors", null);
__decorate([
    (0, common_1.Get)('instructors/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "findInstructorById", null);
__decorate([
    (0, common_1.Post)('rounds'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [academy_dto_1.CreateRoundDto]),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "createRound", null);
__decorate([
    (0, common_1.Get)('rounds'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "findAllRounds", null);
__decorate([
    (0, common_1.Get)('rounds/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademyController.prototype, "findRoundById", null);
exports.AcademyController = AcademyController = __decorate([
    (0, common_1.Controller)('academy'),
    __metadata("design:paramtypes", [academy_service_1.AcademyService])
], AcademyController);
//# sourceMappingURL=academy.controller.js.map