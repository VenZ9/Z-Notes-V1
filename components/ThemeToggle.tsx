"use client";
import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("znotes-theme") as Mode) || "system";
    setMode(saved);
  }, []);

  function apply(next: Mode) {
    setMode(next);
    localStorage.setItem("znotes-theme", next);
    const dark = next === "dark" || (next === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      {(["light", "dark", "system"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => apply(m)}
          className={`px-2 py-1 rounded border ${mode === m ? "bg-bg text-fg" : "text-muted hover:text-fg"}`}
          aria-label={`${m} theme`}
        >
          {m[0].toUpperCase()}
        </button>
      ))}
    </div>
  );
}
