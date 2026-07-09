import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bsa_wallet_adjustments')
export class WalletAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wallet_name', type: 'varchar', nullable: true })
  walletName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balance: number;

  @Column({ name: 'adj_date', type: 'timestamp', nullable: true })
  adjDate: Date;

  @Column({ name: 'saved_at', type: 'timestamp', nullable: true })
  savedAt: Date;
}
