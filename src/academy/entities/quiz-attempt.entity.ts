import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Student } from './student.entity';
import { AcademyContent } from './academy-content.entity';

@Entity('academy_quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  attemptId: string;

  @Column({ name: 'legacy_attempt_id', type: 'varchar', nullable: true, unique: true })
  legacyAttemptId: string;

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

  @Column({ name: 'questions_json', type: 'jsonb', nullable: true })
  questionsJson: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'varchar', nullable: true })
  status: string;
}
