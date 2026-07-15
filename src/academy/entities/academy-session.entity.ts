import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('academy_sessions')
export class AcademySession {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  token: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  role: 'student' | 'instructor';

  @Column({ name: 'is_bsa', type: 'boolean', default: false })
  isBsa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
