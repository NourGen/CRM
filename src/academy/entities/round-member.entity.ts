import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Round } from './round.entity';
import { User } from '../../sales/entities/user.entity';

@Entity('round_members')
export class RoundMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'oc_code', type: 'varchar', nullable: true })
  ocCode: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  action: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paid: number;

  @Column({ type: 'varchar', nullable: true })
  method: string;

  @Column({ type: 'text', nullable: true })
  attendance: string;

  @Column({ name: 'agent_legacy_id', type: 'varchar', nullable: true })
  agentLegacyId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ name: 'agent_name', type: 'varchar', nullable: true })
  agentName: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
