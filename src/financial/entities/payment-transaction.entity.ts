import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ClientPayment } from './client-payment.entity';
import { User } from '../../sales/entities/user.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_transaction_id', type: 'varchar', nullable: true, unique: true })
  legacyTransactionId: string;

  @Column({ name: 'legacy_payment_id', type: 'varchar', nullable: true })
  legacyPaymentId: string;

  @ManyToOne(() => ClientPayment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_id' })
  payment: ClientPayment;

  @Column({ name: 'client_name', type: 'varchar', nullable: true })
  clientName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ name: 'agent_legacy_id', type: 'varchar', nullable: true })
  agentLegacyId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ name: 'agent_name', type: 'varchar', nullable: true })
  agentName: string;
}
