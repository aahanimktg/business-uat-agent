type ExecutionProgressBarProps = {
  completed: number;
  total: number;
};

export default function ExecutionProgressBar({
  completed,
  total,
}: ExecutionProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">
          {completed} of {total} test cases completed
        </span>
        <span className="font-semibold text-slate-900 dark:text-white">{percent}%</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall execution progress"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
