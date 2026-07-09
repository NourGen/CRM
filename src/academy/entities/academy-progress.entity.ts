import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { AcademyContent } from './academy-content.entity';

@Entity('academy_progress')
export class AcademyProgress {
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

  @Column({ name: 'watched_at', type: 'timestamp', nullable: true })
  watchedAt: Date;

  @Column({ type: 'boolean', default: false })
  completed: boolean;
}
