"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<any>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(false);

  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const storedPlan = localStorage.getItem("selectedPlan");

    if (storedPlan) {
      setPlan(JSON.parse(storedPlan));
    }
  }, []);

  if (!plan) {
    return <div className="p-10">Loading Review...</div>;
  }

  async function submitReview() {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:4000/review", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          storyId: plan.storyId,
          version: plan.version || 1,
          answers,
          additionalFeedback: feedback,
          currentPlan: plan,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      if (result.updatedPlan) {
        setPlan(result.updatedPlan);

        localStorage.setItem(
          "selectedPlan",
          JSON.stringify(result.updatedPlan),
        );
      }

      setAnswers({});
      setFeedback("");
    } catch (error) {
      console.error(error);

      alert("Failed To Update Plan");
    } finally {
      setLoading(false);
    }
  }

  async function approveStory() {
    try {
      setApproving(true);

      const response = await fetch("http://localhost:4000/approve", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          storyId: plan.storyId,
          currentPlan: plan,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      localStorage.removeItem("selectedPlan");

      sessionStorage.setItem("reloadPlans", "true");

      router.push("/");
    } catch (error) {
      console.error(error);

      alert("Story Approval Failed");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}

      <div className="bg-white rounded shadow p-6">
        <h1 className="text-3xl font-bold">{plan.title}</h1>

        <p className="mt-2 text-gray-600">Story ID: {plan.storyId}</p>

        <div className="mt-3 flex gap-8">
          <span>
            <strong>Version:</strong> {plan.version || 1}
          </span>

          <span>
            <strong>Status:</strong> {plan.status || "draft"}
          </span>
        </div>
      </div>

      {/* Clarification Status */}

      {plan.clarifications?.length === 0 ? (
        <div className="mt-6 p-4 rounded bg-green-100 text-green-700 font-semibold">
          ✅ All Clarifications Resolved
        </div>
      ) : (
        <div className="mt-6 p-4 rounded bg-yellow-100 text-yellow-800 font-semibold">
          Open Clarifications: {plan.clarifications.length}
        </div>
      )}

      {/* Test Cases */}

      <h2 className="text-2xl font-bold mt-10">Test Cases</h2>

      {plan.testCases?.map((tc: any) => (
        <div
          key={tc.id}
          className="
            bg-white
            shadow
            rounded
            p-5
            mt-5
          "
        >
          <div className="flex justify-between">
            <h3 className="font-bold text-lg">
              {tc.id}
              {" - "}
              {tc.title}
            </h3>

            <span className="bg-blue-100 px-3 py-1 rounded">{tc.priority}</span>
          </div>

          <div className="mt-3">
            <p>
              <strong>Type:</strong> {tc.type}
            </p>

            <p>
              <strong>Acceptance Criteria:</strong>{" "}
              {tc.acceptanceCriteriaIds?.join(", ")}
            </p>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Objective</h4>

            <p>{tc.objective}</p>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Preconditions</h4>

            <ul className="list-disc ml-6">
              {tc.preconditions?.map((pre: string, index: number) => (
                <li key={index}>{pre}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Steps</h4>

            <ol className="list-decimal ml-6">
              {tc.steps?.map((step: string, index: number) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Expected Result</h4>

            <p>{tc.expectedOutcome}</p>
          </div>
        </div>
      ))}

      {/* Clarifications */}

      {plan.clarifications?.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mt-12">Clarifications</h2>

          {plan.clarifications.map((cl: any) => (
            <div
              key={cl.id}
              className="
                border
                rounded
                bg-white
                mt-5
                p-5
              "
            >
              <h4 className="font-semibold">{cl.question}</h4>

              <p className="mt-2 text-red-600">{cl.businessImpact}</p>

              <textarea
                rows={4}
                className="
                    w-full
                    border
                    mt-4
                    p-3
                  "
                value={answers[cl.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [cl.id]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </>
      )}

      {/* Feedback */}

      <h2 className="text-2xl font-bold mt-12">Additional Feedback</h2>

      <textarea
        rows={6}
        className="
          w-full
          border
          mt-3
          p-3
        "
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />

      {/* Actions */}

      <div className="mt-10">
        {plan.clarifications?.length > 0 ? (
          <button
            onClick={submitReview}
            disabled={loading}
            className="
              bg-blue-600
              text-white
              px-6
              py-3
              rounded
            "
          >
            {loading ? "Updating Plan..." : "Submit Review"}
          </button>
        ) : (
          <button
            onClick={approveStory}
            disabled={approving}
            className="
              bg-green-600
              text-white
              px-6
              py-3
              rounded
            "
          >
            {approving ? "Approving..." : "Approve Story"}
          </button>
        )}
      </div>
    </div>
  );
}
