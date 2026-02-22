'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { StageData, NODE_CATEGORY_CONFIG } from '@/types';
import { renderStageIcon } from '@/lib/stageIcons';

export function StageNode({ data, id, selected }: NodeProps<StageData>) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const { setNodes } = useReactFlow();

  const category = data.category ?? 'consideration';
  const catConfig = NODE_CATEGORY_CONFIG[category];

  // ── Proper React Flow data update (no direct mutation) ──────────────────────
  const updateNodeData = useCallback(
    (partial: Partial<StageData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...partial } } : n
        )
      );
    },
    [id, setNodes]
  );

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    updateNodeData({ title: editTitle });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleSave();
    else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditTitle(data.title);
    }
  };

  return (
    <div
      className={`w-56 overflow-hidden rounded-lg border bg-white shadow-xl transition-all duration-150 dark:bg-[#0f1117] ${
        selected
          ? 'ring-2 ring-offset-1 ring-offset-slate-100 dark:ring-offset-[#0f1117]'
          : 'border-neutral-300 hover:border-neutral-400 dark:border-white/10 dark:hover:border-white/20'
      }`}
      style={
        selected
          ? { borderColor: catConfig.accent, boxShadow: `0 0 0 2px ${catConfig.accent}40` }
          : undefined
      }
    >
      {/* Category header stripe */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: catConfig.accent }}
      />

      {/* Handles in */}
      <Handle
        type="target"
        id="target-top"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-100 dark:!border-[#0f1117]"
        style={{ backgroundColor: catConfig.accent }}
      />
      <Handle
        type="target"
        id="target-left"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-100 dark:!border-[#0f1117]"
        style={{ backgroundColor: catConfig.accent }}
      />

      <div className="p-4">

        <div className="mb-1 flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
            style={{ color: catConfig.accent }}
          >
            {renderStageIcon(data.icon, category, { size: 14, strokeWidth: 2.2 })}
          </span>

          <div
            onDoubleClick={() => setIsEditingTitle(true)}
            className="min-w-0 flex-1 cursor-text text-sm font-semibold text-white"
          >
            {isEditingTitle ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-white/20 dark:bg-white/10 dark:text-white dark:focus:border-white/40"
              />
            ) : (
              <span className="block truncate text-neutral-900 dark:text-white">{data.title}</span>
            )}
          </div>
        </div>

        <p className="mb-3 line-clamp-2 text-[11px] leading-snug text-neutral-600 dark:text-white/40">
          {data.description}
        </p>

        {data.image?.src && (
          <div className="overflow-hidden rounded-md border border-neutral-300 bg-neutral-100 dark:border-white/10 dark:bg-white/5">
            <Image
              src={data.image.src}
              alt={data.title}
              width={data.image.width}
              height={data.image.height}
              unoptimized
              className="h-20 w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Handles out */}
      <Handle
        type="source"
        id="source-right"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-100 dark:!border-[#0f1117]"
        style={{ backgroundColor: catConfig.accent }}
      />
      <Handle
        type="source"
        id="source-bottom"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-100 dark:!border-[#0f1117]"
        style={{ backgroundColor: catConfig.accent }}
      />
    </div>
  );
}
