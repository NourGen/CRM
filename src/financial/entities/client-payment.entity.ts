import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../sales/entities/user.entity';
import { Round } from '../../academy/entities/round.entity';

@Entity('client_payments')
export class ClientPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true })
  legacyId: string; // OC Code or client payment ID

  @Column({ name: 'agent_legacy_id', type: 'varchar', nullable: true })
  agentLegacyId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ name: 'client_legacy_id', type: 'varchar', nullable: true })
  clientLegacyId: string;

  @Column({ name: 'client_name', type: 'varchar', nullable: true })
  clientName: string;

  @Column({ type: 'varchar', nullable: true })
  course: string;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'round_name', type: 'varchar', nullable: true })
  roundName: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ name: 'agent_username', type: 'varchar', nullable: true })
  agentUsername: string;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid: number;

  @Column({ name: 'amount_unpaid', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountUnpaid: number;

  @Column({ name: 'payment_time', type: 'timestamp', nullable: true })
  paymentTime: Date;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'amount_detail1', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountDetail1: number;

  @Column({ name: 'amount_detail2', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountDetail2: number;

  @Column({ name: 'amount_detail3', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountDetail3: number;

  @Column({ name: 'last_modified', type: 'timestamp', nullable: true })
  lastModified: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_by', type: 'varchar', nullable: true })
  deletedBy: string;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
