'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { Trash2 } from 'lucide-react';
import { StageData, NODE_CATEGORY_CONFIG } from '@/types';
import { renderStageIcon } from '@/lib/stageIcons';

export function StageNode({ data, id, selected }: NodeProps<StageData>) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const { setNodes, setEdges } = useReactFlow();

  const category = data.category ?? 'consideration';
  const catConfig = NODE_CATEGORY_CONFIG[category];
  const badges = (data.badges ?? []).map((badge) => badge.trim()).filter(Boolean);
  const appearance = data.appearance ?? {};
  const customBackgroundColor = appearance.backgroundColor;
  const contentColor = appearance.contentColor ?? 'black';
  const cardSize = appearance.size ?? 'md';
  const titleSize = appearance.titleSize ?? 'lg';
  const iconSize = appearance.iconSize ?? 'lg';
  const showIcon = appearance.showIcon ?? true;
  const showTitle = appearance.showTitle ?? true;
  const showDescription = appearance.showDescription ?? true;
  const showBadges = appearance.showBadges ?? true;
  const showImage = appearance.showImage ?? true;
  const cardBackground = customBackgroundColor ?? `${catConfig.accent}A8`;
  const selectedBorderColor = customBackgroundColor ?? '#3b82f6';
  const contentTextClass = contentColor === 'white' ? 'text-white' : 'text-black';
  const descriptionTextClass = contentColor === 'white' ? 'text-white/80' : 'text-neutral-700';
  const sizeClasses = {
    sm: { width: 'w-48', padding: 'p-3', imageHeight: 'h-16' },
    md: { width: 'w-56', padding: 'p-4', imageHeight: 'h-20' },
    lg: { width: 'w-64', padding: 'p-5', imageHeight: 'h-24' },
    xl: { width: 'w-72', padding: 'p-5', imageHeight: 'h-28' },
    '2xl': { width: 'w-80', padding: 'p-6', imageHeight: 'h-32' },
  } as const;
  const titleClasses = {
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
  } as const;
  const iconSizeMap = {
    lg: 16,
    xl: 20,
    '2xl': 24,
  } as const;
  const currentSize = sizeClasses[cardSize];

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

  const handleDeleteNode = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
      setNodes((nds) => nds.filter((node) => node.id !== id));
    },
    [id, setEdges, setNodes]
  );

  return (
    <div
      className={`group relative ${currentSize.width} rounded-lg border shadow-xl transition-all duration-150`}
      style={{
        backgroundColor: cardBackground,
        borderColor: selected ? selectedBorderColor : 'transparent',
        borderWidth: selected ? 3 : 0,
      }}
    >
      <button
        type="button"
        onClick={handleDeleteNode}
        onMouseDown={(event) => event.stopPropagation()}
        className="absolute right-2 top-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-700 opacity-0 shadow-sm transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:bg-[#0f1117]/90 dark:text-white/65 dark:hover:bg-red-500/20 dark:hover:text-red-400"
        title="Delete node"
      >
        <Trash2 size={14} />
      </button>

      {/* Handles in */}
      <Handle
        type="target"
        id="target-top"
        position={Position.Top}
        className="!h-4 !w-4 !-top-2 !rounded-full !border-2 !border-slate-100 !opacity-0 !transition-opacity !duration-150 group-hover:!opacity-100 dark:!border-[#0f1117]"
        style={{ backgroundColor: catConfig.accent }}
      />
      <Handle
        type="target"
        id="target-left"
        position={Position.Left}
        className="!h-4 !w-4 !-left-2 !rounded-full !border-2 !border-slate-100 !opacity-0 !transition-opacity !duration-150 group-hover:!opacity-100 dark:!border-[#0f1117]"
        style={{ backgroundColor: catConfig.accent }}
      />

      <div className={currentSize.padding}>

        {(showIcon || showTitle) && (
          <div className="mb-1 flex items-center gap-2">
            {showIcon && (
              <span
                className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ${contentTextClass}`}
              >
                {renderStageIcon(data.icon, category, {
                  size: iconSizeMap[iconSize],
                  strokeWidth: 2.2,
                })}
              </span>
            )}

            {showTitle && (
              <div
                onDoubleClick={() => setIsEditingTitle(true)}
                className={`min-w-0 flex-1 cursor-text font-semibold ${titleClasses[titleSize]} ${contentTextClass}`}
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
                  <span className="block truncate">{data.title}</span>
                )}
              </div>
            )}
          </div>
        )}

        {showDescription && (
          <p className={`mb-3 line-clamp-2 text-[11px] leading-snug ${descriptionTextClass}`}>
            {data.description}
          </p>
        )}

        {showBadges && badges.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {badges.slice(0, 4).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-black bg-white px-2 py-0.5 text-[10px] font-medium text-black"
              >
                {badge}
              </span>
            ))}
            {badges.length > 4 && (
              <span
                className="rounded-full border border-black bg-white px-2 py-0.5 text-[10px] font-medium text-black"
              >
                +{badges.length - 4}
              </span>
            )}
          </div>
        )}

        {showImage && data.image?.src && (
          <div className="overflow-hidden rounded-md border border-neutral-300 bg-neutral-100 dark:border-white/10 dark:bg-white/5">
            <Image
              src={data.image.src}
              alt={data.title}
              width={data.image.width}
              height={data.image.height}
              unoptimized
              className={`${currentSize.imageHeight} w-full object-cover`}
            />
          </div>
        )}
      </div>

      {/* Handles out */}
      <Handle
        type="source"
        id="source-right"
        position={Position.Right}
        className="!h-4 !w-4 !-right-2 !rounded-full !border-2 !border-slate-100 !opacity-0 !transition-opacity !duration-150 group-hover:!opacity-100 dark:!border-[#0f1117]"
        style={{ backgroundColor: catConfig.accent }}
      />
      <Handle
        type="source"
        id="source-bottom"
        position={Position.Bottom}
        className="!h-4 !w-4 !-bottom-2 !rounded-full !border-2 !border-slate-100 !opacity-0 !transition-opacity !duration-150 group-hover:!opacity-100 dark:!border-[#0f1117]"
        style={{ backgroundColor: catConfig.accent }}
      />
    </div>
  );
}
