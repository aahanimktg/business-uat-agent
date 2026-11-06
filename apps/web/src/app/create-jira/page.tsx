"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllSprints, createJira } from "@/lib/api";

export default function CreateJiraPage() {
  const router = useRouter();
  const [sprints, setSprints] = useState<any[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [sprintId, setSprintId] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingSprints(true);
        const response = await getAllSprints();
        if (response.success) {
          setSprints(response.sprints || []);
          const active = response.sprints?.find((s: any) => s.state === "active");
          if (active) setSprintId(String(active.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSprints(false);
      }
    })();
  }, []);

  async function handleSubmit() {
    if (!sprintId) {
      setError("Select a sprint first.");
      return;
    }
    if (!description.trim() && !file) {
      setError("Provide a description and/or upload a file.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setResult(null);
      const response = await createJira({
        sprintId: Number(sprintId),
        description,
        file,
      });
      setResult(response);
      setDescription("");
      setFile(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to create Jira");
    } finally {
      setSubmitting(false);
    }
  }

  function goToDashboard() {
    if (result) {
      sessionStorage.setItem("focusSprintId", String(result.issue.sprintId));
    }
    router.push("/");
  }

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-800">Create Jira</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload a doc/image or describe the requirement — AI will draft and create
          the Jira story for you.
        </p>
      </header>

      <div className="w-full px-8 py-8 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">Sprint</label>
            <select
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              className="border border-slate-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {loadingSprints ? "Loading sprints..." : "Select a sprint"}
              </option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} ({sprint.state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Upload Document (PDF, image, or DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
            />
            {file && <p className="text-xs text-slate-500 mt-2">Selected: {file.name}</p>}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the requirement in your own words..."
              className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            {submitting ? "Creating with AI..." : "Create Jira with AI"}
          </button>
        </div>
      </div>

      {result && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
            <h2 className="text-lg font-bold text-green-700">
              ✅ Created {result.issue.key}
            </h2>
            <p className="mt-2 font-medium text-slate-800">{result.draft.summary}</p>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
              {result.draft.description}
            </p>
            {result.draft.acceptanceCriteria?.length > 0 && (
              <ul className="list-disc ml-6 mt-3 text-sm text-slate-600">
                {result.draft.acceptanceCriteria.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={goToDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setResult(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg font-medium transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
