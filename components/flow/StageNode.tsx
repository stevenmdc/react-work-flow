'use client';

import Image from 'next/image';
import { ReactNode, useState, useCallback } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { Trash2 } from 'lucide-react';
import {
  DEFAULT_STAGE_CONTENT_ORDER,
  StageContentSection,
  StageData,
  NODE_CATEGORY_CONFIG,
} from '@/types';
import { renderStageIcon } from '@/lib/stageIcons';

function toOpaqueColor(color: string) {
  const value = color.trim();

  if (/^#[0-9a-fA-F]{4}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }

  if (/^#[0-9a-fA-F]{8}$/.test(value)) {
    return value.slice(0, 7);
  }

  const rgbaMatch = value.match(
    /^rgba\(\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*[^)]+\)$/i
  );
  if (rgbaMatch) {
    return `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
  }

  const hslaMatch = value.match(/^hsla\(\s*([^)]+),\s*[^)]+\)$/i);
  if (hslaMatch) {
    return `hsl(${hslaMatch[1]})`;
  }

  return value;
}

const sharedHandleClassName =
  '!h-4 !w-4 !rounded-full !border-2 !border-slate-100 !opacity-0 !transition-opacity !duration-150 group-hover:!opacity-100 dark:!border-[#0f1117]';
const fontClassNames = {
  default: 'font-flow-default',
  assistant: 'font-flow-assistant',
  patrick: 'font-flow-patrick',
  caveat: 'font-flow-caveat',
} as const;

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
  const cardShape = appearance.cardShape ?? 'rectangle';
  const titleSize =
    appearance.titleSize === '6xl'
      ? '6xl'
      : appearance.titleSize === '4xl'
        ? '4xl'
        : appearance.titleSize ?? '2xl';
  const iconSize =
    appearance.iconSize === '6xl'
      ? '6xl'
      : appearance.iconSize === '4xl'
        ? '4xl'
        : appearance.iconSize ?? 'xl';
  const fontFamily = appearance.fontFamily ?? 'default';
  const contentOrder = appearance.contentOrder ?? DEFAULT_STAGE_CONTENT_ORDER;
  const showIcon = appearance.showIcon ?? false;
  const showTitle = appearance.showTitle ?? true;
  const showDescription = appearance.showDescription ?? true;
  const showBadges = appearance.showBadges ?? true;
  const showImage = appearance.showImage ?? true;
  const cardBackground = toOpaqueColor(customBackgroundColor ?? catConfig.accent);
  const selectedBorderColor = '#3b82f6';
  const contentTextClass = contentColor === 'white' ? 'text-white' : 'text-black';
  const descriptionTextClass = contentColor === 'white' ? 'text-white/80' : 'text-neutral-700';
  const sizeClasses = {
    sm: { width: 'w-24', padding: 'p-2.5', imageHeight: 'h-10' },
    md: { width: 'w-36', padding: 'p-3', imageHeight: 'h-14' },
    lg: { width: 'w-48', padding: 'p-4', imageHeight: 'h-16' },
    xl: { width: 'w-60', padding: 'p-5', imageHeight: 'h-20' },
    '2xl': { width: 'w-72', padding: 'p-6', imageHeight: 'h-24' },
  } as const;
  const titleClasses = {
    xl: 'text-lg',
    '2xl': 'text-xl',
    '4xl': 'text-3xl leading-none',
    '6xl': 'text-5xl leading-none',
  } as const;
  const iconSizeMap = {
    xl: 20,
    '2xl': 24,
    '4xl': 32,
    '6xl': 44,
  } as const;
  const currentSize = sizeClasses[cardSize];
  const fontClassName = fontClassNames[fontFamily];
  const shapeClasses = {
    rectangle: {
      container: 'rounded-lg',
      content: '',
      imageHeight: currentSize.imageHeight,
      imageWrapper: '',
    },
    square: {
      container: 'aspect-square rounded-[1.75rem]',
      content: 'flex h-full flex-col justify-center',
      imageHeight: 'h-20',
      imageWrapper: '',
    },
    round: {
      container: 'aspect-square rounded-full',
      content: 'flex h-full flex-col justify-center items-center text-center',
      imageHeight: 'h-20',
      imageWrapper: 'mx-auto w-full max-w-[72%]',
    },
  } as const;
  const activeShape = shapeClasses[cardShape];
  const isCenteredShape = cardShape === 'round';

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
  const hasBadges = badges.length > 0;
  const hasImage = Boolean(data.image?.src);
  const sectionVisibility: Record<StageContentSection, boolean> = {
    icon: showIcon,
    title: showTitle,
    description: showDescription,
    badges: showBadges && hasBadges,
    image: showImage && hasImage,
  };
  const titleBlock = showTitle ? (
    <div
      onDoubleClick={() => setIsEditingTitle(true)}
      className={`min-w-0 cursor-text font-semibold text-center ${titleClasses[titleSize]} ${contentTextClass}`}
    >
      {isEditingTitle ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
          className={`w-full rounded border border-neutral-300 bg-white px-2 py-1 text-center text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-white/20 dark:bg-white/10 dark:text-white dark:focus:border-white/40 ${fontClassName}`}
        />
      ) : (
        <span className="block truncate">{data.title}</span>
      )}
    </div>
  ) : null;
  const contentSections: Partial<Record<StageContentSection, ReactNode>> = {
    icon: showIcon ? (
      <div className="flex justify-center">
        <span
          className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${contentTextClass}`}
        >
          {renderStageIcon(data.icon, category, {
            size: iconSizeMap[iconSize],
            strokeWidth: 2.2,
          })}
        </span>
      </div>
    ) : null,
    title: titleBlock,
    description: showDescription ? (
      <p
        className={`line-clamp-2 text-[11px] leading-snug ${descriptionTextClass} ${
          isCenteredShape ? 'text-center' : ''
        }`}
      >
        {data.description}
      </p>
    ) : null,
    badges: showBadges && hasBadges ? (
      <div className={`flex flex-wrap gap-1.5 ${isCenteredShape ? 'justify-center' : ''}`}>
        {badges.slice(0, 4).map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-black/30 bg-white px-2 py-0.5 text-[10px] font-medium text-black"
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
      ) : null,
    image: showImage && hasImage ? (
      <div
        className={`overflow-hidden rounded-md border border-neutral-300 bg-neutral-100 dark:border-white/10 dark:bg-white/5 ${activeShape.imageWrapper}`}
      >
        <Image
          src={data.image!.src}
          alt={data.title}
          width={data.image!.width}
          height={data.image!.height}
          unoptimized
          className={`${activeShape.imageHeight} w-full object-cover`}
        />
      </div>
    ) : null,
  };
  const orderedSections = contentOrder
    .filter(
      (section, index, array) =>
        array.indexOf(section) === index &&
        DEFAULT_STAGE_CONTENT_ORDER.includes(section),
    )
    .concat(
      DEFAULT_STAGE_CONTENT_ORDER.filter((section) => !contentOrder.includes(section)),
    );
  const visibleSections = orderedSections.filter((section) => sectionVisibility[section]);

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
      className={`group relative ${currentSize.width} ${activeShape.container} border shadow-xl transition-all duration-150`}
      style={{
        backgroundColor: cardBackground,
        borderColor: 'transparent',
        boxShadow: selected
          ? `0 0 0 3px ${selectedBorderColor}, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`
          : undefined,
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
        type="source"
        id="handle-top"
        position={Position.Top}
        className={`!-top-2 ${sharedHandleClassName}`}
        style={{ left: '50%', backgroundColor: catConfig.accent }}
      />
      <Handle
        type="source"
        id="handle-left"
        position={Position.Left}
        className={`!-left-2 ${sharedHandleClassName}`}
        style={{ top: '50%', backgroundColor: catConfig.accent }}
      />
      <Handle
        type="source"
        id="handle-right"
        position={Position.Right}
        className={`!-right-2 ${sharedHandleClassName}`}
        style={{ top: '50%', backgroundColor: catConfig.accent }}
      />
      <Handle
        type="source"
        id="handle-bottom"
        position={Position.Bottom}
        className={`!-bottom-2 ${sharedHandleClassName}`}
        style={{ left: '50%', backgroundColor: catConfig.accent }}
      />

      <div className={`${currentSize.padding} ${fontClassName} ${activeShape.content}`}>
        {visibleSections.map((section, index) => (
          <div key={section} className={index < visibleSections.length - 1 ? 'mb-3' : ''}>
            {contentSections[section]}
          </div>
        ))}
      </div>
    </div>
  );
}
