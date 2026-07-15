import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true })
  legacyId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'text', nullable: true })
  schedule: string;

  @Column({ name: 'max_seats', type: 'integer', nullable: true })
  maxSeats: number;

  @Column({ type: 'integer', nullable: true })
  enrolled: number;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  type: string; // 'Online' | 'Offline'

  @Column({ name: 'instructor_name', type: 'varchar', nullable: true })
  instructorName: string;

  @Column({ name: 'offer_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  offerPrice: number;

  @Column({ name: 'offer_expiry', type: 'timestamp', nullable: true })
  offerExpiry: Date;

  @Column({ name: 'deleted_by', type: 'varchar', nullable: true })
  deletedBy: string;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
