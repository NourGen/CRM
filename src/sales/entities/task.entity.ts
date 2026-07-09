import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  time: Date;
}
