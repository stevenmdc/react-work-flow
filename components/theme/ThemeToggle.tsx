'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="fixed right-4 top-4 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300/80 bg-white/90 text-neutral-700 shadow-lg backdrop-blur transition-colors hover:bg-white dark:border-white/15 dark:bg-[#0f1117]/90 dark:text-neutral-100 dark:hover:bg-[#171a23]/95"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
