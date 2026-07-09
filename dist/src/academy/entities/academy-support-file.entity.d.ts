import { AcademyContent } from './academy-content.entity';
export declare class AcademySupportFile {
    id: string;
    legacyId: string;
    lectureLegacyId: string;
    lecture: AcademyContent;
    lectureName: string;
    title: string;
    driveFileId: string;
    fileName: string;
    fileType: string;
    url: string;
    createdAt: Date;
    createdBy: string;
}
