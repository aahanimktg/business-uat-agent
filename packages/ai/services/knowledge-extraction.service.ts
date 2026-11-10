export class KnowledgeExtractionService {
  async extractKnowledge(
    approvedPlan: any,
    feedbackHistory: any[],
  ) {
    const knowledge: string[] = [];

    for (const feedback of feedbackHistory) {
      Object.values(feedback.answers || {}).forEach((answer: any) => {
        if (answer && answer.trim()) {
          knowledge.push(answer.trim());
        }
      });

      if (feedback.additionalFeedback) {
        knowledge.push(feedback.additionalFeedback);
      }
    }

    return knowledge;
  }
}
