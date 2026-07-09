import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Round } from './round.entity';

@Entity('rounds_attendance')
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'student_phone', type: 'varchar', nullable: true })
  studentPhone: string;

  @Column({ name: 'student_name', type: 'varchar', nullable: true })
  studentName: string;

  @Column({ name: 'attended_list', type: 'jsonb', nullable: true })
  attendedList: string[];

  @Column({ name: 'tasks_list', type: 'jsonb', nullable: true })
  tasksList: string[];

  @Column({ name: 'last_updated', type: 'timestamp', nullable: true })
  lastUpdated: Date;
}
