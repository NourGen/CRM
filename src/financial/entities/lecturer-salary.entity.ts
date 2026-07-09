import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Round } from '../../academy/entities/round.entity';

@Entity('lecturer_salaries')
export class LecturerSalary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true })
  legacyId: string;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'round_name', type: 'varchar', nullable: true })
  roundName: string;

  @Column({ name: 'round_type', type: 'varchar', nullable: true })
  roundType: string;

  @Column({ name: 'instructor_name', type: 'varchar', nullable: true })
  instructorName: string;

  @Column({ name: 'pay1_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pay1Amount: number;

  @Column({ name: 'pay1_status', type: 'varchar', nullable: true })
  pay1Status: string;

  @Column({ name: 'pay1_paid_date', type: 'timestamp', nullable: true })
  pay1PaidDate: Date;

  @Column({ name: 'pay2_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pay2Amount: number;

  @Column({ name: 'pay2_status', type: 'varchar', nullable: true })
  pay2Status: string;

  @Column({ name: 'pay2_paid_date', type: 'timestamp', nullable: true })
  pay2PaidDate: Date;

  @Column({ name: 'alert1_triggered', type: 'boolean', default: false })
  alert1Triggered: boolean;

  @Column({ name: 'alert2_triggered', type: 'boolean', default: false })
  alert2Triggered: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
