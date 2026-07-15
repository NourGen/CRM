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

  @Column({ name: 'profile_pic', type: 'mediumtext', nullable: true })
  profilePic: string; // base64 data-URI avatars from the legacy sheet — far larger than varchar(255)

  @Column({ name: 'is_bsa', type: 'boolean', default: false })
  isBsa: boolean;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
