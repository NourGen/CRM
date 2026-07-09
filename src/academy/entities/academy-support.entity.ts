import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';

@Entity('academy_support')
export class AcademySupport {
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

  @Column({ type: 'varchar', nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
