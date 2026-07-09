import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Round } from './round.entity';

@Entity('academy_enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'student_legacy_id', type: 'varchar', nullable: true })
  studentLegacyId: string;

  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'round_name', type: 'varchar', nullable: true })
  roundName: string;

  @Column({ name: 'enrolled_at', type: 'timestamp', nullable: true })
  enrolledAt: Date;

  @Column({ type: 'varchar', nullable: true })
  status: string;
}
