export class ReviewService {
  async submitReview(review: any) {
    return {
      success: true,
      submittedOn: new Date().toISOString(),
    };
  }
}
