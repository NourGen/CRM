import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Round } from './round.entity';

@Entity('academy_final_projects')
export class AcademyFinalProject {
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

  @Column({ name: 'drive_file_id', type: 'varchar', nullable: true })
  driveFileId: string;

  @Column({ name: 'file_name', type: 'varchar', nullable: true })
  fileName: string;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ name: 'reviewed_by', type: 'varchar', nullable: true })
  reviewedBy: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'outline_file_id', type: 'varchar', nullable: true })
  outlineFileId: string;

  @Column({ name: 'outline_file_name', type: 'varchar', nullable: true })
  outlineFileName: string;
}
