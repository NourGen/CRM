import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Round } from './round.entity';
import { AcademyContent } from './academy-content.entity';

@Entity('academy_tasks')
export class AcademyTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'student_legacy_id', type: 'varchar', nullable: true })
  studentLegacyId: string;

  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_name', type: 'varchar', nullable: true })
  studentName: string;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'lecture_legacy_id', type: 'varchar', nullable: true })
  lectureLegacyId: string;

  @ManyToOne(() => AcademyContent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lecture_id' })
  lecture: AcademyContent;

  @Column({ name: 'lecture_name', type: 'varchar', nullable: true })
  lectureName: string;

  @Column({ name: 'drive_file_id', type: 'varchar', nullable: true })
  driveFileId: string;

  @Column({ name: 'file_name', type: 'varchar', nullable: true })
  fileName: string;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'reviewed_by', type: 'varchar', nullable: true })
  reviewedBy: string;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string;
}
