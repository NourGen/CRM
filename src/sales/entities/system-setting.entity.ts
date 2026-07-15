import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// Key-value store replacing Apps Script's PropertiesService (system settings, campaign/platform
// lists, open attendance sessions, etc.)
@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn({ type: 'varchar', length: 191 })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
