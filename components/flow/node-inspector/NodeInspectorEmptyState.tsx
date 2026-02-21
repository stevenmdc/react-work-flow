export function NodeInspectorEmptyState() {
  return (
    <aside className="flex h-full w-64 flex-col items-center justify-center border-l border-neutral-300 bg-white/90 px-6 text-center backdrop-blur-sm dark:border-white/5 dark:bg-[#0a0c12]">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-200 dark:bg-white/5">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-neutral-500 dark:text-white/20"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
      <p className="text-xs font-medium text-neutral-700 dark:text-white/20">Select a node</p>
      <p className="mt-1 text-[10px] text-neutral-500 dark:text-white/20">
        Click any node on the canvas to inspect and edit its parameters
      </p>
    </aside>
  );
}
