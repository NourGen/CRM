import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { AcademyContent } from './academy-content.entity';

@Entity('academy_quiz_results')
export class QuizResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'student_legacy_id', type: 'varchar', nullable: true })
  studentLegacyId: string;

  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'lecture_legacy_id', type: 'varchar', nullable: true })
  lectureLegacyId: string;

  @ManyToOne(() => AcademyContent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lecture_id' })
  lecture: AcademyContent;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'boolean', nullable: true })
  passed: boolean;

  @Column({ name: 'attempt_at', type: 'timestamp', nullable: true })
  attemptAt: Date;

  @Column({ name: 'total_q', type: 'integer', nullable: true })
  totalQ: number;

  @Column({ name: 'correct_q', type: 'integer', nullable: true })
  correctQ: number;
}
