'use client';

import { ArrowLeftRight, Trash2 } from 'lucide-react';

type EdgeActionControlsProps = {
  x: number;
  y: number;
  visible: boolean;
  onReverse?: () => void;
  onDelete?: () => void;
};

export function EdgeActionControls({
  x,
  y,
  visible,
  onReverse,
  onDelete,
}: EdgeActionControlsProps) {
  return (
    <foreignObject
      x={x - 34}
      y={y - 14}
      width={68}
      height={28}
      className="overflow-visible"
      style={{ pointerEvents: visible ? 'all' : 'none' }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <div
          className={`nopan nodrag flex items-center gap-1 rounded-full border border-neutral-300 bg-white/95 p-1 shadow-lg transition-all dark:border-white/10 dark:bg-[#0f1117]/95 ${
            visible ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
          }`}
        >
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onReverse?.();
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            title="Reverse direction"
          >
            <ArrowLeftRight size={12} />
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.();
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/20"
            title="Delete connector"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </foreignObject>
  );
}
