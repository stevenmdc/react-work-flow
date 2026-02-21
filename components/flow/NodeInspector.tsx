'use client';

// components/flow/NodeInspector.tsx
// Right panel — shows settings of the currently selected node

import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { StageData, NODE_CATEGORY_CONFIG } from '@/types';

interface NodeInspectorProps {
  nodeId: string | null;
}

// ── Tiny field components ─────────────────────────────────────────────────────

function TextField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-neutral-500 dark:text-white/30">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 bg-white/80 px-3 py-2 text-xs text-neutral-700 outline-none transition-colors focus:border-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:focus:border-white/30"
      />
    </div>
  );
}

function TextAreaField({
  label, value, onChange, rows = 3,
}: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-neutral-500 dark:text-white/30">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-none rounded-lg border border-neutral-300 bg-white/80 px-3 py-2 text-xs text-neutral-700 outline-none transition-colors focus:border-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:focus:border-white/30"
      />
    </div>
  );
}

function ToggleField({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-neutral-700 dark:text-white/60">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          value ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NodeInspector({ nodeId }: NodeInspectorProps) {
  const { getNode, setNodes, deleteElements, getEdges } = useReactFlow();

  const node = nodeId ? getNode(nodeId) : null;
  const data: StageData | null = node ? (node.data as StageData) : null;
  const category = data?.category ?? 'consideration';
  const catConfig = data ? NODE_CATEGORY_CONFIG[category] : null;

  const updateData = useCallback(
    (partial: Partial<StageData>) => {
      if (!nodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
        )
      );
    },
    [nodeId, setNodes]
  );

  const updateParam = useCallback(
    (key: string, value: string | number | boolean) => {
      if (!data) return;
      updateData({ params: { ...(data.params ?? {}), [key]: value } });
    },
    [data, updateData]
  );

  const handleDelete = () => {
    if (!nodeId) return;
    const edges = getEdges().filter(
      (e) => e.source === nodeId || e.target === nodeId
    );
    deleteElements({ nodes: [{ id: nodeId }], edges });
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!data || !catConfig) {
    return (
      <aside className="flex h-full w-64 flex-col items-center justify-center border-l border-neutral-300 bg-white/90 px-6 text-center backdrop-blur-sm dark:border-white/5 dark:bg-[#0a0c12]">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-200 dark:bg-white/5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" className="text-neutral-500 dark:text-white/20">
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

  const params = data.params ?? {};

  return (
    <aside className="flex h-full w-64 flex-col overflow-hidden border-l border-neutral-300 bg-white/90 backdrop-blur-sm dark:border-white/5 dark:bg-[#0a0c12]">
      {/* Header */}
      <div
        className="border-b border-neutral-300 px-4 pb-3 pt-4 dark:border-white/5"
        style={{ borderTopColor: catConfig.accent, borderTopWidth: 2 }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: catConfig.accent }}
            >
              {catConfig.label}
            </span>
            <h3 className="mt-0.5 truncate text-sm font-semibold text-neutral-900 dark:text-white">
              {data.title}
            </h3>
          </div>
          <button
            onClick={handleDelete}
            title="Delete node"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-red-500/20 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* ── Core fields ── */}
        <section>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/20">
            General
          </p>
          <div className="space-y-3">
            <TextField
              label="Title"
              value={data.title}
              onChange={(v) => updateData({ title: v })}
            />
            <TextAreaField
              label="Description"
              value={data.description}
              onChange={(v) => updateData({ description: v })}
              rows={2}
            />
          </div>
        </section>

        {/* ── Dynamic params ── */}
        {Object.keys(params).length > 0 && (
          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/20">
              Parameters
            </p>
            <div className="space-y-3">
              {Object.entries(params).map(([key, val]) => {
                if (typeof val === 'boolean') {
                  return (
                    <ToggleField
                      key={key}
                      label={key}
                      value={val}
                      onChange={(v) => updateParam(key, v)}
                    />
                  );
                }
                if (key === 'prompt' || key === 'headers' || key === 'mapping') {
                  return (
                    <TextAreaField
                      key={key}
                      label={key}
                      value={String(val)}
                      onChange={(v) => updateParam(key, v)}
                      rows={3}
                    />
                  );
                }
                return (
                  <TextField
                    key={key}
                    label={key}
                    value={String(val)}
                    onChange={(v) => updateParam(key, v)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ── Node ID (read-only) ── */}
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/20">
            Meta
          </p>
          <div className="rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 font-mono text-[10px] text-neutral-600 dark:border-white/8 dark:bg-white/5 dark:text-white/40">
            ID: {nodeId}
          </div>
        </section>
      </div>
    </aside>
  );
}
