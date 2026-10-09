"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/notes", label: "Notes" },
  { href: "/research", label: "Research" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="md:w-60 md:min-h-screen md:border-r md:flex md:flex-col bg-panel">
      <div className="hidden md:flex items-center justify-between px-4 py-4 border-b">
        <Link href="/notes" className="font-semibold tracking-tight">Z-Notes</Link>
        <ThemeToggle />
      </div>
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b">
        <Link href="/notes" className="font-semibold tracking-tight">Z-Notes</Link>
        <ThemeToggle />
      </div>
      <nav className="flex md:flex-col overflow-x-auto md:overflow-visible px-2 py-2 md:py-3 gap-1">
        {NAV.map((n) => {
          const active = path === n.href || path.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap transition-colors ${
                active ? "bg-bg font-medium" : "text-muted hover:text-fg hover:bg-bg"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden md:block mt-auto px-4 py-3 text-xs text-muted border-t">
        Private deployment
      </div>
    </aside>
  );
            }
