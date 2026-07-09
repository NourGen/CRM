import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Round } from './round.entity';

@Entity('academy_live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_session_id', type: 'varchar', nullable: true, unique: true })
  legacySessionId: string;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'round_name', type: 'varchar', nullable: true })
  roundName: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ name: 'meet_link', type: 'varchar', nullable: true })
  meetLink: string;

  @Column({ type: 'varchar', nullable: true })
  platform: string;

  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
