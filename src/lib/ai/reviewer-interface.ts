import { PRReviewContext, ReviewOutput } from '../types/review';

export interface CodeReviewer {
  analyzePR(context: PRReviewContext): Promise<ReviewOutput>;
}
