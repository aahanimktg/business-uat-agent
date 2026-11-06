"use client";

import { useEffect, useState } from "react";
import { getReportsOverview } from "@/lib/api";

export default function ReportsPage() {
  const [sprintSummaries, setSprintSummaries] = useState<any[]>([]);
  const [monthSummaries, setMonthSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await getReportsOverview();
        if (response.success) {
          setSprintSummaries(response.sprintSummaries || []);
          setMonthSummaries(response.monthSummaries || []);
        } else {
          setError(response.message ?? "Failed to load report");
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to load report");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-800">Overall Report</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sprint-wise and month-wise summary across the Jira board.
        </p>
      </header>

      <div className="w-full px-8 py-8">
        {loading && <p className="text-sm text-slate-500">Loading report...</p>}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Sprint-wise Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4">Sprint</th>
                      <th className="py-2 pr-4">State</th>
                      <th className="py-2 pr-4">Start Date</th>
                      <th className="py-2 pr-4">Total Stories</th>
                      <th className="py-2 pr-4">Generated</th>
                      <th className="py-2 pr-4">Approved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sprintSummaries.map((s) => (
                      <tr key={s.sprintId} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-800">{s.name}</td>
                        <td className="py-2 pr-4 capitalize">{s.state}</td>
                        <td className="py-2 pr-4">
                          {s.startDate ? new Date(s.startDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-2 pr-4">{s.totalStories}</td>
                        <td className="py-2 pr-4">{s.generated}</td>
                        <td className="py-2 pr-4">{s.approved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Month-wise Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4">Month</th>
                      <th className="py-2 pr-4">Sprints</th>
                      <th className="py-2 pr-4">Total Stories</th>
                      <th className="py-2 pr-4">Generated</th>
                      <th className="py-2 pr-4">Approved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthSummaries.map((m) => (
                      <tr key={m.month} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-800">{m.month}</td>
                        <td className="py-2 pr-4">{m.sprintCount}</td>
                        <td className="py-2 pr-4">{m.totalStories}</td>
                        <td className="py-2 pr-4">{m.generated}</td>
                        <td className="py-2 pr-4">{m.approved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
