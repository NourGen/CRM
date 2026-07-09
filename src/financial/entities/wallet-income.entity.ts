import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('wallet_income')
export class WalletIncome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_income_id', type: 'varchar', nullable: true, unique: true })
  legacyIncomeId: string;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  @Column({ type: 'varchar', nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  wallet: string;

  @Column({ type: 'varchar', nullable: true })
  method: string;

  @Column({ type: 'varchar', nullable: true })
  by: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
