'use client';

import Image from 'next/image';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Edge, Node } from 'reactflow';
import { StageData, NODE_CATEGORY_CONFIG } from '@/types';
import { getResolvedStageIconName, renderStageIcon } from '@/lib/stageIcons';
import {
  createNodeImageAsset,
  formatBytes,
  MAX_NODE_IMAGE_BYTES,
} from '@/lib/nodeImage';
import { IconPickerField } from './node-inspector/IconPickerField';
import { NodeInspectorEmptyState } from './node-inspector/NodeInspectorEmptyState';
import { BadgeListField, TextAreaField, TextField, ToggleField } from './node-inspector/Fields';

interface NodeInspectorProps {
  nodeId: string | null;
  nodes: Node<StageData>[];
  setNodes: Dispatch<SetStateAction<Node<StageData>[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onNodeDeleted?: (id: string) => void;
}

export function NodeInspector({
  nodeId,
  nodes,
  setNodes,
  setEdges,
  onNodeDeleted,
}: NodeInspectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const node = nodeId ? nodes.find((n) => n.id === nodeId) ?? null : null;
  const data: StageData | null = node ? (node.data as StageData) : null;
  const category = data?.category ?? 'consideration';
  const catConfig = data ? NODE_CATEGORY_CONFIG[category] : null;
  const resolvedIconKey = data ? getResolvedStageIconName(data) : null;

  useEffect(() => {
    setImageError(null);
    setIsUploadingImage(false);
  }, [nodeId]);

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

  const updateParam = (key: string, value: string | number | boolean) => {
    if (!nodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const current = n.data as StageData;
        return {
          ...n,
          data: {
            ...n.data,
            params: { ...(current.params ?? {}), [key]: value },
          },
        };
      })
    );
  };

  const handleDelete = () => {
    if (!nodeId) return;
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    onNodeDeleted?.(nodeId);
  };

  const openImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !nodeId) return;

    setImageError(null);
    setIsUploadingImage(true);
    try {
      const image = await createNodeImageAsset(file);
      updateData({ image });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    updateData({ image: null });
    setImageError(null);
  };

  if (!data || !catConfig) {
    return <NodeInspectorEmptyState />;
  }

  const params = data.params ?? {};
  const badges = data.badges ?? [];

  return (
    <aside className="relative z-30 flex h-full w-64 flex-col overflow-visible border-l border-neutral-300 bg-white/90 backdrop-blur-sm dark:border-white/5 dark:bg-[#0a0c12]">
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
            <div className="mt-0.5 flex items-center gap-1.5">
              {resolvedIconKey && renderStageIcon(resolvedIconKey, category, {
                size: 14,
                strokeWidth: 2.2,
                style: { color: catConfig.accent },
              })}
              <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                {data.title}
              </h3>
            </div>
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

      <div className="flex-1 space-y-5 overflow-y-auto overflow-x-visible px-4 py-4">
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
            {resolvedIconKey && (
              <IconPickerField
                value={resolvedIconKey}
                category={category}
                accentColor={catConfig.accent}
                onChange={(v) => updateData({ icon: v })}
              />
            )}
            <TextAreaField
              label="Description"
              value={data.description}
              onChange={(v) => updateData({ description: v })}
              rows={2}
            />
            <BadgeListField
              label="Badges"
              value={badges}
              onChange={(v) => updateData({ badges: v })}
              placeholder="Ex: Top funnel"
            />
          </div>
        </section>

        <section>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/20">
            Media
          </p>
          <div className="space-y-2">
            {data.image?.src ? (
              <div className="overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100 dark:border-white/10 dark:bg-white/5">
                <Image
                  src={data.image.src}
                  alt={data.title}
                  width={data.image.width}
                  height={data.image.height}
                  unoptimized
                  className="h-28 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-100 text-[11px] text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/30">
                No image uploaded
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openImagePicker}
                disabled={isUploadingImage}
                className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
              >
                {isUploadingImage ? 'Processing...' : 'Upload image'}
              </button>
              {data.image?.src && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <p className="text-[10px] text-neutral-500 dark:text-white/25">
              Max stored size: {formatBytes(MAX_NODE_IMAGE_BYTES)} (auto resized/compressed).
            </p>

            {data.image?.src && (
              <p className="text-[10px] text-neutral-500 dark:text-white/25">
                {data.image.name} · {formatBytes(data.image.bytes)} · {data.image.width}x{data.image.height}
              </p>
            )}

            {imageError && (
              <p className="text-[10px] text-red-600 dark:text-red-400">{imageError}</p>
            )}
          </div>
        </section>

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
