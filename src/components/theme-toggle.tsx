"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  useLayoutEffect(() => {
    try {
      document.documentElement.classList.toggle("dark", localStorage.getItem("lumina-theme") === "dark");
    } catch { /* Storage can be disabled; switching still works for this page. */ }
  }, []);

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("lumina-theme", dark ? "dark" : "light");
    } catch { /* Keep the in-memory preference when storage is unavailable. */ }
  }

  return (
    <Button variant="outline" size="icon-lg" aria-label="切换深浅主题" title="切换深浅主题" onClick={toggleTheme}>
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
    </Button>
  );
}
