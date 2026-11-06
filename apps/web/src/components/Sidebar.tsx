"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/create-jira", label: "Create Jira", icon: "➕" },
  { href: "/reports", label: "Reports", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-slate-800">
        <h1 className="text-lg font-bold text-white">UAT Agent</h1>
        <p className="text-xs text-slate-400 mt-1">Business Validation Platform</p>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500">
        AI-Powered UAT Planning
      </div>
    </aside>
  );
}
