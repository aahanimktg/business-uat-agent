export default function StatCard({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  accent?: "blue" | "green" | "yellow" | "slate";
}) {
  const accentClasses: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    slate: "text-slate-700",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${accentClasses[accent]}`}>{value}</p>
    </div>
  );
}
