import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AcademyLedger } from './academy-ledger.entity';

@Entity('installments')
export class Installment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AcademyLedger, (ledger) => ledger.installments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledger_id' })
  ledger: AcademyLedger;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  paymentMethod: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string; // 'Paid' | 'Pending' | etc.

  @Column({ name: 'installment_order', type: 'integer' })
  installmentOrder: number; // 1, 2, 3
}
