import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('break_logs')
export class BreakLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_legacy_id', type: 'varchar', nullable: true })
  agentLegacyId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ name: 'agent_name', type: 'varchar', nullable: true })
  agentName: string;

  @Column({ type: 'date', nullable: true })
  date: string;

  @Column({ name: 'login_time', type: 'timestamp', nullable: true })
  loginTime: Date;

  @Column({ name: 'logout_time', type: 'timestamp', nullable: true })
  logoutTime: Date;

  @Column({ name: 'lunch_start', type: 'timestamp', nullable: true })
  lunchStart: Date;

  @Column({ name: 'lunch_end', type: 'timestamp', nullable: true })
  lunchEnd: Date;

  @Column({ name: 'break1_start', type: 'timestamp', nullable: true })
  break1Start: Date;

  @Column({ name: 'break1_end', type: 'timestamp', nullable: true })
  break1End: Date;

  @Column({ name: 'break2_start', type: 'timestamp', nullable: true })
  break2Start: Date;

  @Column({ name: 'break2_end', type: 'timestamp', nullable: true })
  break2End: Date;

  @Column({ name: 'work_duration', type: 'varchar', nullable: true })
  workDuration: string;

  @Column({ name: 'total_break', type: 'varchar', nullable: true })
  totalBreak: string;

  @Column({ type: 'varchar', nullable: true })
  overtime: string;

  @Column({ name: 'early_logout_reason', type: 'text', nullable: true })
  earlyLogoutReason: string;
}
