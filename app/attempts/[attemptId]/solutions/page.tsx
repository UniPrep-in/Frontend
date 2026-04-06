import SolutionsReview from "../components/SolutionsReview";
import { getAttemptReviewData } from "../review-data";

interface Props {
  params: Promise<{ attemptId: string }>;
}

export default async function SolutionsPage({ params }: Props) {
  const { attemptId } = await params;
  const reviewData = await getAttemptReviewData(attemptId);

  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <SolutionsReview
          attemptId={reviewData.attemptId}
          answers={reviewData.solutionAnswers}
          testTitle={reviewData.testTitle}
        />
      </div>
    </main>
  );
}
