'use client';

import { useSyncExternalStore } from 'react';
import { Github, Moon, Star, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="fixed right-4 top-4 z-60 flex items-center gap-2">
      <a
        href="https://github.com/stevenmdc/react-work-flow"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300/80 bg-white/90 px-3 text-sm font-medium text-neutral-700 shadow-lg backdrop-blur transition-colors hover:bg-white dark:border-white/15 dark:bg-[#0a0c12] dark:text-neutral-100 dark:hover:bg-[#171a23]/95"
      >
        <Github className="h-4 w-4" />
        <span>GitHub Stars</span>
        <Star className="h-4 w-4" />
      </a>

      <button
        type="button"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300/80 bg-white/90 text-neutral-700 shadow-lg backdrop-blur transition-colors hover:bg-white dark:border-white/15 dark:bg-[#0a0c12] dark:text-neutral-100 dark:hover:bg-[#171a23]/95"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </div>
  );
}
