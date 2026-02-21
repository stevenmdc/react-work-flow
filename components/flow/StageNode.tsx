'use client';

import { useState, useCallback } from 'react';
import { NodeProps, Handle, Position, useReactFlow, useStore } from 'reactflow';
import { StageData, StageEdge, NODE_CATEGORY_CONFIG } from '@/types';
import { getIncomingCount, getOutgoingCount } from '@/lib/flowUtils';

export function StageNode({ data, id, selected }: NodeProps<StageData>) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const { setNodes } = useReactFlow();
  const edges = useStore((state) => state.edges as StageEdge[]);

  const inCount = getIncomingCount(id, edges);
  const outCount = getOutgoingCount(id, edges);

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
      className={`w-56 overflow-hidden rounded-xl border bg-white shadow-xl transition-all duration-150 dark:bg-[#0f1117] ${
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

      <div className="px-3 pt-2.5 pb-3">
        {/* Category badge + title */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ backgroundColor: catConfig.accent + '22', color: catConfig.accent }}
          >
            {catConfig.label}
          </span>
        </div>

        <div
          onDoubleClick={() => setIsEditingTitle(true)}
          className="text-sm font-semibold text-white mb-1 cursor-text"
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

        <p className="mb-3 line-clamp-2 text-[11px] leading-snug text-neutral-600 dark:text-white/40">
          {data.description}
        </p>
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
