import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('exception_requests')
export class ExceptionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'agent_legacy_id', type: 'varchar', nullable: true })
  agentLegacyId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ name: 'agent_name', type: 'varchar', nullable: true })
  agentName: string;

  @Column({ name: 'client_name', type: 'varchar', nullable: true })
  clientName: string;

  @Column({ name: 'client_phone', type: 'varchar', nullable: true })
  clientPhone: string;

  @Column({ name: 'client_oc', type: 'varchar', nullable: true })
  clientOc: string;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'decided_at', type: 'timestamp', nullable: true })
  decidedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;
}
