import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';

@Entity('academy_survey_responses')
export class AcademySurveyResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'varchar', length: 191 })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_name', type: 'varchar', length: 191 })
  studentName: string;

  @Column({ name: 'round_id', type: 'varchar', length: 191 })
  roundId: string;

  @Column({ name: 'round_name', type: 'varchar', length: 191, nullable: true })
  roundName: string;

  @Column({ name: 'lecture_id', type: 'varchar', length: 191 })
  lectureId: string;

  @Column({ name: 'lecture_num', type: 'int' })
  lectureNum: number;

  @Column({ name: 'lecture_name', type: 'varchar', length: 191, nullable: true })
  lectureName: string;

  // We store all answers as a JSON string
  @Column({ type: 'text' })
  answers: string;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
