import type { ExecutionCaseResult, ExecutionJob } from "@/lib/api";

type ExecutionSummaryProps = {
  job: ExecutionJob;
  cases: ExecutionCaseResult[];
};

export default function ExecutionSummary({ job, cases }: ExecutionSummaryProps) {
  const passed = cases.filter(testCase => testCase.status === "passed").length;
  const failed = cases.filter(testCase => testCase.status === "failed").length;
  const blocked = cases.filter(testCase => testCase.status === "blocked").length;
  const total = cases.length;
  const passRate = total ? ((passed / total) * 100).toFixed(1) : "0.0";
  const failures = cases.filter(testCase => testCase.status === "failed" || testCase.status === "blocked");

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Execution summary</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
          {job.storyId} · {total} test cases
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total tests", total, "text-slate-900 dark:text-white"],
          ["Passed", passed, "text-green-700 dark:text-green-300"],
          ["Failed", failed, "text-red-700 dark:text-red-300"],
          ["Blocked", blocked, "text-amber-700 dark:text-amber-300"],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">Pass rate: <strong>{passRate}%</strong></p>
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
        <h3 className="font-semibold text-violet-950 dark:text-violet-100">AI execution insights</h3>
        <p className="mt-1 text-sm text-violet-900 dark:text-violet-200">
          {passed} of {total} validations passed. Failure analysis below is based on execution evidence and the bounded healer&apos;s diagnosis.
        </p>
        {failures.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {failures.map(testCase => (
              <li key={testCase.testCaseId} className="rounded-lg bg-white/70 p-3 dark:bg-slate-900/70">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {testCase.testCaseId} · {testCase.status}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {testCase.aiAnalysis ?? testCase.actualResult ?? "No diagnosis was recorded for this result."}
                </p>
                {testCase.expectedResult && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Expected: {testCase.expectedResult}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-green-800 dark:text-green-300">All test cases passed.</p>
        )}
      </div>
      {job.result?.artifacts && (
        <details className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-200">Story artifacts</summary>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {Object.entries(job.result.artifacts).map(([name, file]) => (
              <li key={name} className="break-all"><strong>{name}:</strong> {file}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
