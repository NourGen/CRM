import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bsa_wallet_transfers')
export class WalletTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  @Column({ name: 'from_wallet', type: 'varchar', nullable: true })
  fromWallet: string;

  @Column({ name: 'to_wallet', type: 'varchar', nullable: true })
  toWallet: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
