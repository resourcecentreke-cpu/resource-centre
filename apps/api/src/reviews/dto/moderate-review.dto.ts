import { IsEnum } from 'class-validator';

export enum ModerationAction {
  Approved = 'approved',
  Rejected = 'rejected',
}

export class ModerateReviewDto {
  @IsEnum(ModerationAction)
  status!: ModerationAction;
}
