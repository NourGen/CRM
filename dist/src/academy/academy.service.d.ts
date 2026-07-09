import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Instructor } from './entities/instructor.entity';
import { Round } from './entities/round.entity';
import { CreateStudentDto, CreateInstructorDto, CreateRoundDto } from './dto/academy.dto';
export declare class AcademyService {
    private readonly studentRepository;
    private readonly instructorRepository;
    private readonly roundRepository;
    constructor(studentRepository: Repository<Student>, instructorRepository: Repository<Instructor>, roundRepository: Repository<Round>);
    createStudent(dto: CreateStudentDto & {
        password?: string;
    }): Promise<Student>;
    findAllStudents(): Promise<Student[]>;
    findStudentById(id: string): Promise<Student>;
    createInstructor(dto: CreateInstructorDto & {
        password?: string;
    }): Promise<Instructor>;
    findAllInstructors(): Promise<Instructor[]>;
    findInstructorById(id: string): Promise<Instructor>;
    createRound(dto: CreateRoundDto): Promise<Round>;
    findAllRounds(): Promise<Round[]>;
    findRoundById(id: string): Promise<Round>;
}
