import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Instructor } from './entities/instructor.entity';
import { Round } from './entities/round.entity';
import { CreateStudentDto, CreateInstructorDto, CreateRoundDto } from './dto/academy.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AcademyService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Instructor)
    private readonly instructorRepository: Repository<Instructor>,
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
  ) {}

  // STUDENT CRUD
  async createStudent(dto: CreateStudentDto & { password?: string }): Promise<Student> {
    const student = new Student();
    Object.assign(student, dto);
    if (dto.password) {
      student.password = await bcrypt.hash(dto.password, 10);
    }
    return this.studentRepository.save(student);
  }

  async findAllStudents(): Promise<Student[]> {
    return this.studentRepository.find();
  }

  async findStudentById(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  // INSTRUCTOR CRUD
  async createInstructor(dto: CreateInstructorDto & { password?: string }): Promise<Instructor> {
    const instructor = new Instructor();
    Object.assign(instructor, dto);
    if (dto.password) {
      instructor.password = await bcrypt.hash(dto.password, 10);
    }
    return this.instructorRepository.save(instructor);
  }

  async findAllInstructors(): Promise<Instructor[]> {
    return this.instructorRepository.find();
  }

  async findInstructorById(id: string): Promise<Instructor> {
    const instructor = await this.instructorRepository.findOne({ where: { id } });
    if (!instructor) throw new NotFoundException('Instructor not found');
    return instructor;
  }

  // ROUND CRUD
  async createRound(dto: CreateRoundDto): Promise<Round> {
    const round = this.roundRepository.create(dto);
    return this.roundRepository.save(round);
  }

  async findAllRounds(): Promise<Round[]> {
    return this.roundRepository.find();
  }

  async findRoundById(id: string): Promise<Round> {
    const round = await this.roundRepository.findOne({ where: { id } });
    if (!round) throw new NotFoundException('Round not found');
    return round;
  }
}
