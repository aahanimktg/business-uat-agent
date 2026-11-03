"use client";

import { useEffect, useState } from "react";
import {
  generatePlan,
  getPlans,
  approveSprint,
} from "@/lib/api";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [sprintId, setSprintId] =
    useState("37");

  const [loading, setLoading] =
    useState(false);

  const [plans, setPlans] =
    useState<any[]>([]);

  async function loadPlans() {
    try {
      const response =
        await getPlans();

      setPlans(
        response.stories || []
      );
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const shouldReload =
      sessionStorage.getItem(
        "reloadPlans"
      );

    if (shouldReload) {
      loadPlans();

      sessionStorage.removeItem(
        "reloadPlans"
      );
    }
  }, []);

  async function handleGenerate() {
    try {
      setLoading(true);

      const result =
        await generatePlan(
          Number(sprintId)
        );

      setPlans(
        result.plans || []
      );

      sessionStorage.setItem(
        "planGenerated",
        "true"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Plan generation failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveSprint() {
    try {
      const result =
        await approveSprint();

      if (result.success) {
        alert(
          "Sprint Approved Successfully"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Sprint Approval Failed"
      );
    }
  }

  const allStoriesApproved =
    plans.length > 0 &&
    plans.every(
      (p) =>
        p.status === "approved"
    );

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto p-10">

        <h1 className="text-3xl font-bold mb-8">
          AI Validation Platform
        </h1>

        {/* Generate Section */}

        <div className="bg-white rounded shadow p-6">

          <label className="block mb-2 font-medium">
            Sprint Id
          </label>

          <div className="flex gap-3">

            <input
              type="number"
              value={sprintId}
              onChange={(e) =>
                setSprintId(
                  e.target.value
                )
              }
              className="
                border
                rounded
                p-2
                w-48
              "
            />

            <button
              onClick={
                handleGenerate
              }
              disabled={loading}
              className="
                bg-blue-600
                text-white
                px-5
                rounded
              "
            >

              {loading
                ? "Generating..."
                : "Generate Plan"}

            </button>

          </div>

        </div>

        {/* Stories */}

        {plans.length > 0 && (

          <div className="mt-10">

            <h2 className="text-2xl font-bold mb-4">
              Generated Plans
            </h2>

            {plans.map((plan) => (

              <div
                key={plan.storyId}
                className="
                  bg-white
                  rounded
                  shadow
                  p-6
                  mb-5
                "
              >

                <h3 className="text-xl font-bold">
                  {plan.title}
                </h3>

                <div className="mt-3 space-y-1">

                  <p>
                    <strong>
                      Story:
                    </strong>{" "}
                    {plan.storyId}
                  </p>

                  <p>
                    <strong>
                      Version:
                    </strong>{" "}
                    {plan.version || 1}
                  </p>

                  <p>
                    <strong>
                      Test Cases:
                    </strong>{" "}
                    {
                      plan.testCases
                        ?.length || 0
                    }
                  </p>

                  <p>
                    <strong>
                      Clarifications:
                    </strong>{" "}
                    {
                      plan
                        .clarifications
                        ?.length || 0
                    }
                  </p>

                </div>

                <div className="mt-3">

                  <span
                    className={`font-semibold ${
                      plan.status ===
                      "approved"

                        ? "text-green-600"

                        : plan.status ===
                          "updated"

                        ? "text-yellow-600"

                        : "text-blue-600"
                    }`}
                  >

                    {plan.status ===
                    "approved"

                      ? "✅ Approved"

                      : plan.status ===
                        "updated"

                      ? "🟡 Ready For Approval"

                      : "🔵 In Review"}

                  </span>

                </div>

                {plan.status ===
                "approved" ? (

                  <div className="mt-4 text-green-600 font-semibold">
                    Story Approved
                  </div>

                ) : (

                  <button
                    onClick={() => {

                      localStorage.setItem(
                        "selectedPlan",
                        JSON.stringify(
                          plan
                        )
                      );

                      router.push(
                        "/review"
                      );

                    }}
                    className="
                      mt-4
                      bg-blue-600
                      text-white
                      px-4
                      py-2
                      rounded
                    "
                  >
                    Open Review
                  </button>

                )}

              </div>

            ))}

          </div>

        )}

        {/* Sprint Approval */}

        {allStoriesApproved && (

          <div className="mt-10 bg-green-100 p-6 rounded">

            <h3 className="text-lg font-bold">
              ✅ All stories approved
            </h3>

            <p className="mt-2">
              Sprint is ready for final approval.
            </p>

            <button
              onClick={
                handleApproveSprint
              }
              className="
                mt-4
                bg-green-600
                text-white
                px-5
                py-3
                rounded
              "
            >
              Approve Sprint
            </button>

          </div>

        )}

      </div>

    </main>
  );
}