import { AcademyService } from './academy.service';
import { CreateStudentDto, CreateInstructorDto, CreateRoundDto } from './dto/academy.dto';
export declare class AcademyController {
    private readonly academyService;
    constructor(academyService: AcademyService);
    createStudent(dto: CreateStudentDto): Promise<import("./entities/student.entity").Student>;
    findAllStudents(): Promise<import("./entities/student.entity").Student[]>;
    findStudentById(id: string): Promise<import("./entities/student.entity").Student>;
    createInstructor(dto: CreateInstructorDto): Promise<import("./entities/instructor.entity").Instructor>;
    findAllInstructors(): Promise<import("./entities/instructor.entity").Instructor[]>;
    findInstructorById(id: string): Promise<import("./entities/instructor.entity").Instructor>;
    createRound(dto: CreateRoundDto): Promise<import("./entities/round.entity").Round>;
    findAllRounds(): Promise<import("./entities/round.entity").Round[]>;
    findRoundById(id: string): Promise<import("./entities/round.entity").Round>;
}
