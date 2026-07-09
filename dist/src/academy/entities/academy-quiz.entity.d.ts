import { AcademyContent } from './academy-content.entity';
import { Round } from './round.entity';
export declare class AcademyQuiz {
    id: string;
    legacyId: string;
    lectureLegacyId: string;
    lecture: AcademyContent;
    roundLegacyId: string;
    round: Round;
    lectureName: string;
    questionsJson: any;
    passScore: number;
    createdAt: Date;
}
