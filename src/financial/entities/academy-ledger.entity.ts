import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Installment } from './installment.entity';

@Entity('academy_ledger')
export class AcademyLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_date', type: 'timestamp', nullable: true })
  bookingDate: Date;

  @Column({ name: 'oc_code', type: 'varchar', nullable: true, unique: true })
  ocCode: string;

  @Column({ name: 'client_name', type: 'varchar', nullable: true })
  clientName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  course: string;

  @Column({ name: 'group_name', type: 'varchar', nullable: true })
  groupName: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPrice: number;

  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  paymentMethod: string;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid: number;

  @Column({ name: 'amount_remaining', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountRemaining: number;

  @Column({ name: 'sales_agent_email', type: 'varchar', nullable: true })
  salesAgentEmail: string;

  @OneToMany(() => Installment, (installment) => installment.ledger, { cascade: true })
  installments: Installment[];
}
