import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AcademyService } from './academy.service';
import { CreateStudentDto, CreateInstructorDto, CreateRoundDto } from './dto/academy.dto';

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Post('students')
  createStudent(@Body() dto: CreateStudentDto) {
    return this.academyService.createStudent(dto);
  }

  @Get('students')
  findAllStudents() {
    return this.academyService.findAllStudents();
  }

  @Get('students/:id')
  findStudentById(@Param('id') id: string) {
    return this.academyService.findStudentById(id);
  }

  @Post('instructors')
  createInstructor(@Body() dto: CreateInstructorDto) {
    return this.academyService.createInstructor(dto);
  }

  @Get('instructors')
  findAllInstructors() {
    return this.academyService.findAllInstructors();
  }

  @Get('instructors/:id')
  findInstructorById(@Param('id') id: string) {
    return this.academyService.findInstructorById(id);
  }

  @Post('rounds')
  createRound(@Body() dto: CreateRoundDto) {
    return this.academyService.createRound(dto);
  }

  @Get('rounds')
  findAllRounds() {
    return this.academyService.findAllRounds();
  }

  @Get('rounds/:id')
  findRoundById(@Param('id') id: string) {
    return this.academyService.findRoundById(id);
  }
}
