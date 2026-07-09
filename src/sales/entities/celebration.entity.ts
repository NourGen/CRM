import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('celebrations')
export class Celebration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_name', type: 'varchar', nullable: true })
  agentName: string;

  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date;

  @Column({ type: 'boolean', default: false })
  seen: boolean;
}
