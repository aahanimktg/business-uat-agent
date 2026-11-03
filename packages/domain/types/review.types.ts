export interface ReviewRequest {

  storyId: string;

  version: number;

  answers: Record<string, string>;

  additionalFeedback: string;

  currentPlan: any;

}

export interface FeedbackHistory {

  version: number;

  answers: Record<string, string>;

  additionalFeedback: string;

  createdOn: string;

}

export interface ReviewSession {

  stories: {

    [storyId: string]: {

      feedbackHistory: FeedbackHistory[];

    }

  };

}