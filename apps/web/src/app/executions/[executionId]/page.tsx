import { Suspense } from "react";
import ExecutionDashboard from "./ExecutionDashboard";

export default async function ExecutionPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50 p-8 text-slate-600 dark:bg-slate-950 dark:text-slate-300">Loading execution…</main>}>
      <ExecutionPageContent params={params} />
    </Suspense>
  );
}

async function ExecutionPageContent({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;
  return <ExecutionDashboard executionId={executionId} />;
}
