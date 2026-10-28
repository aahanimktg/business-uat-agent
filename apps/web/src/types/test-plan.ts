export interface TestCase {

  id: string;

  title: string;

  objective: string;

  expectedOutcome: string;

  acceptanceCriteriaIds: string[];

}

export interface Clarification {

  id: string;

  type: string;

  question: string;

  businessImpact: string;

}

export interface TestPlan {

  storyId: string;

  title: string;

  testCases: TestCase[];

  clarifications: Clarification[];

}