import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('academy_instructors')
export class Instructor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true })
  legacyId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'profile_pic', type: 'varchar', nullable: true })
  profilePic: string;

  @Column({ name: 'is_bsa', type: 'boolean', default: false })
  isBsa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
