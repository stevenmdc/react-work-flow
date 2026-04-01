'use client';

import Image from 'next/image';
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dispatch, SetStateAction } from 'react';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Edge, Node } from 'reactflow';
import {
  DEFAULT_STAGE_CONTENT_ORDER,
  NODE_CATEGORY_CONFIG,
  StageCardShape,
  StageContentSection,
  StageData,
  StageFontFamily,
} from '@/types';
import { getResolvedStageIconName, renderStageIcon } from '@/lib/stageIcons';
import {
  createNodeImageAsset,
  formatBytes,
  MAX_NODE_IMAGE_BYTES,
} from '@/lib/nodeImage';
import { IconPickerField } from './node-inspector/IconPickerField';
import {
  BadgeListField,
  ColorField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from './node-inspector/Fields';

interface NodeInspectorProps {
  nodeId: string | null;
  nodes: Node<StageData>[];
  setNodes: Dispatch<SetStateAction<Node<StageData>[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onNodeDeleted?: (id: string) => void;
  onNodeDuplicated?: (id: string) => void;
}

interface DisclosureSectionProps {
  title: string;
  active?: boolean;
  onActiveChange?: (value: boolean) => void;
  dragHandle?: ReactNode;
  children: ReactNode;
}

function DisclosureSection({
  title,
  active,
  onActiveChange,
  dragHandle,
  children,
}: DisclosureSectionProps) {
  const isToggleable = typeof active === 'boolean' && typeof onActiveChange === 'function';
  const isVisible = active ?? true;

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-300 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3 px-3 py-2.5">
        {dragHandle}
        <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-900 dark:text-white">{title}</p>
          </div>
        </div>

        {isToggleable && (
          <button
            type="button"
            aria-pressed={isVisible}
            onClick={() => onActiveChange(!isVisible)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              isVisible ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-white/10'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                isVisible ? 'translate-x-4' : ''
              }`}
            />
          </button>
        )}
      </div>

      {isVisible && (
        <div className="border-t border-neutral-300 px-3 py-3 dark:border-white/10">
          {children}
        </div>
      )}
    </section>
  );
}

interface SortableDisclosureSectionProps extends DisclosureSectionProps {
  id: StageContentSection;
}

function SortableDisclosureSection({
  id,
  ...props
}: SortableDisclosureSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? 'z-10 opacity-90' : undefined}
    >
      <DisclosureSection
        {...props}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(event) => event.preventDefault()}
            className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:text-white/25 dark:hover:bg-white/10 dark:hover:text-white/65"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      />
    </div>
  );
}

export function NodeInspector({
  nodeId,
  nodes,
  setNodes,
  setEdges,
  onNodeDeleted,
  onNodeDuplicated,
}: NodeInspectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const node = nodeId ? nodes.find((n) => n.id === nodeId) ?? null : null;
  const data: StageData | null = node ? (node.data as StageData) : null;
  const category = data?.category ?? 'consideration';
  const catConfig = data ? NODE_CATEGORY_CONFIG[category] : null;
  const resolvedIconKey = data ? getResolvedStageIconName(data) : null;
  const appearance = data?.appearance ?? {};
  const contentOrder = useMemo(() => {
    const currentOrder = appearance.contentOrder ?? DEFAULT_STAGE_CONTENT_ORDER;
    const uniqueKnown = currentOrder.filter(
      (section, index) =>
        currentOrder.indexOf(section) === index &&
        DEFAULT_STAGE_CONTENT_ORDER.includes(section)
    );

    return uniqueKnown.concat(
      DEFAULT_STAGE_CONTENT_ORDER.filter((section) => !uniqueKnown.includes(section))
    );
  }, [appearance.contentOrder]);
  const showIcon = appearance.showIcon ?? false;
  const showTitle = appearance.showTitle ?? true;
  const showDescription = appearance.showDescription ?? true;
  const showBadges = appearance.showBadges ?? true;
  const showImage = appearance.showImage ?? true;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    setImageError(null);
    setIsUploadingImage(false);
    if (nodeId) setIsCollapsed(false);
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

  const updateAppearance = useCallback(
    (partial: NonNullable<StageData['appearance']>) => {
      if (!nodeId) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const current = n.data as StageData;
          return {
            ...n,
            data: {
              ...n.data,
              appearance: { ...(current.appearance ?? {}), ...partial },
            },
          };
        })
      );
    },
    [nodeId, setNodes]
  );

  const setSectionVisibility = useCallback(
    (
      value: boolean,
      appearanceKey: 'showIcon' | 'showTitle' | 'showDescription' | 'showBadges' | 'showImage'
    ) => {
      updateAppearance({ [appearanceKey]: value });
    },
    [updateAppearance]
  );

  const handleContentOrderChange = useCallback(
    (nextOrder: StageContentSection[]) => {
      updateAppearance({ contentOrder: nextOrder });
    },
    [updateAppearance]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = contentOrder.indexOf(active.id as StageContentSection);
      const newIndex = contentOrder.indexOf(over.id as StageContentSection);
      if (oldIndex === -1 || newIndex === -1) return;

      handleContentOrderChange(arrayMove(contentOrder, oldIndex, newIndex));
    },
    [contentOrder, handleContentOrderChange]
  );

  const handleDelete = () => {
    if (!nodeId) return;
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    onNodeDeleted?.(nodeId);
  };

  const handleDuplicate = () => {
    if (!node) return;
    const currentData = node.data as StageData;

    const duplicateId = `node_${crypto.randomUUID()}`;
    const duplicatedNode: Node<StageData> = {
      ...node,
      id: duplicateId,
      position: {
        x: node.position.x + 48,
        y: node.position.y + 48,
      },
      selected: false,
      dragging: false,
      data: {
        ...currentData,
        params: currentData.params ? { ...currentData.params } : {},
        badges: currentData.badges ? [...currentData.badges] : [],
        image: currentData.image ? { ...currentData.image } : null,
        appearance: currentData.appearance ? { ...currentData.appearance } : {},
      },
    };

    setNodes((nds) => nds.concat(duplicatedNode));
    onNodeDuplicated?.(duplicateId);
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
  const panelAccentColor = catConfig?.accent ?? '#94a3b8';

  if (isCollapsed) {
    return (
      <aside
        className="relative z-30 flex h-full w-14 flex-col items-center border-r border-neutral-300 bg-white/90 py-3 backdrop-blur-sm transition-[width] duration-200 dark:border-white/5 dark:bg-[#0a0c12]"
        style={{ borderTopColor: panelAccentColor, borderTopWidth: 2 }}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          title="Open inspector"
          className="mb-3 inline-flex h-8 w-8 items-center justify-center bg-white text-neutral-700 rounded-xl hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        <div
          className="mb-3 h-8 w-1 rounded-full"
          style={{ backgroundColor: panelAccentColor }}
        />

        {resolvedIconKey && data ? (
          <div
            className="inline-flex h-9 w-9 items-center justify-center  bg-white/80 dark:border-white/10 dark:bg-white/5"
            style={{ color: panelAccentColor }}
            title={data.title}
          >
            {renderStageIcon(resolvedIconKey, category, {
              size: 16,
              strokeWidth: 2.2,
            })}
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-300 bg-white/80 text-base font-medium text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/35">
            n
          </div>
        )}
      </aside>
    );
  }

  if (!data || !catConfig) {
    return (
      <aside
        className="relative z-30 flex h-full w-64 flex-col border-r border-neutral-300 bg-white/90 backdrop-blur-sm transition-[width] duration-200 dark:border-white/5 dark:bg-[#0a0c12]"
        style={{ borderTopColor: panelAccentColor, borderTopWidth: 2 }}
      >
        <div className="flex items-center justify-end px-3 pt-3">
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Collapse inspector"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
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
        </div>
      </aside>
    );
  }

  const params = data.params ?? {};
  const badges = data.badges ?? [];
  const backgroundColor = appearance.backgroundColor ?? catConfig.accent;
  const contentColor = appearance.contentColor ?? 'black';
  const size = appearance.size ?? 'md';
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
  const sortableSectionPanels: Record<
    StageContentSection,
    Omit<SortableDisclosureSectionProps, 'id'>
  > = {
    icon: {
      title: 'Icon',
      active: showIcon,
      onActiveChange: (value) => setSectionVisibility(value, 'showIcon'),
      children: (
        <div className="space-y-3">
          <SelectField
            label="Icon size"
            value={iconSize}
            onChange={(v) => updateAppearance({ iconSize: v as 'xl' | '2xl' | '4xl' | '6xl' })}
            options={[
              { label: 'XL', value: 'xl' },
              { label: '2XL', value: '2xl' },
              { label: '4XL', value: '4xl' },
              { label: '6XL', value: '6xl' },
            ]}
          />
          {resolvedIconKey && (
            <IconPickerField
              value={resolvedIconKey}
              category={category}
              accentColor={catConfig.accent}
              onChange={(v) => updateData({ icon: v })}
            />
          )}
        </div>
      ),
    },
    title: {
      title: 'Title',
      active: showTitle,
      onActiveChange: (value) => setSectionVisibility(value, 'showTitle'),
      children: (
        <div className="space-y-3">
          <TextField
            label="Title"
            value={data.title}
            onChange={(v) => updateData({ title: v })}
          />
          <SelectField
            label="Title size"
            value={titleSize}
            onChange={(v) => updateAppearance({ titleSize: v as 'xl' | '2xl' | '4xl' | '6xl' })}
            options={[
              { label: 'XL', value: 'xl' },
              { label: '2XL', value: '2xl' },
              { label: '4XL', value: '4xl' },
              { label: '6XL', value: '6xl' },
            ]}
          />
          <SelectField
            label="Font"
            value={fontFamily}
            onChange={(v) => updateAppearance({ fontFamily: v as StageFontFamily })}
            options={[
              { label: 'Default', value: 'default' },
              { label: 'Assistant', value: 'assistant' },
              { label: 'Patrick Hand', value: 'patrick' },
              { label: 'Caveat', value: 'caveat' },
            ]}
          />
        </div>
      ),
    },
    description: {
      title: 'Description',
      active: showDescription,
      onActiveChange: (value) =>
        setSectionVisibility(value, 'showDescription'),
      children: (
        <TextAreaField
          label="Description"
          value={data.description}
          onChange={(v) => updateData({ description: v })}
          rows={3}
        />
      ),
    },
    badges: {
      title: 'Badges',
      active: showBadges,
      onActiveChange: (value) => setSectionVisibility(value, 'showBadges'),
      children: (
        <BadgeListField
          label="Badges"
          value={badges}
          onChange={(v) => updateData({ badges: v })}
          placeholder="Ex: Top funnel"
        />
      ),
    },
    image: {
      title: 'Image',
      active: showImage,
      onActiveChange: (value) => setSectionVisibility(value, 'showImage'),
      children: (
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
      ),
    },
  };

  return (
    <aside
      className="relative z-30 flex h-full w-64 flex-col overflow-visible border-r border-neutral-300 bg-white/90 backdrop-blur-sm transition-[width] duration-200 dark:border-white/5 dark:bg-[#0a0c12]"
      style={{ borderTopColor: panelAccentColor, borderTopWidth: 2 }}
    >
      <div
        className="border-b border-neutral-300 px-4 pb-3 pt-4 dark:border-white/5"
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
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Collapse inspector"
            className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white/80"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto overflow-x-visible px-4 py-4">
        <div className="space-y-3">
          <DisclosureSection
            title="Card"
          >
            <div className="space-y-3">
              <ColorField
                label="Card background"
                value={backgroundColor}
                onChange={(v) => updateAppearance({ backgroundColor: v })}
                onReset={() => updateAppearance({ backgroundColor: undefined })}
              />
              <SelectField
                label="Content color"
                value={contentColor}
                onChange={(v) => updateAppearance({ contentColor: v as 'black' | 'white' })}
                options={[
                  { label: 'Black', value: 'black' },
                  { label: 'White', value: 'white' },
                ]}
              />
              <SelectField
                label="Card size"
                value={size}
                onChange={(v) => updateAppearance({ size: v as 'sm' | 'md' | 'lg' | 'xl' | '2xl' })}
                options={[
                  { label: 'Small', value: 'sm' },
                  { label: 'Medium', value: 'md' },
                  { label: 'Large', value: 'lg' },
                  { label: 'XL', value: 'xl' },
                  { label: '2XL', value: '2xl' },
                ]}
              />
              <SelectField
                label="Card shape"
                value={cardShape}
                onChange={(v) => updateAppearance({ cardShape: v as StageCardShape })}
                options={[
                  { label: 'Rectangle', value: 'rectangle' },
                  { label: 'Square', value: 'square' },
                  { label: 'Round', value: 'round' },
                ]}
              />
            </div>
          </DisclosureSection>

          <div className="space-y-2">
            <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/20">
              Card Content Order
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={contentOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {contentOrder.map((section) => (
                    <SortableDisclosureSection
                      key={section}
                      id={section}
                      {...sortableSectionPanels[section]}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

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

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/20">
            Actions
          </p>
          <button
            type="button"
            onClick={handleDuplicate}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="10" height="10" rx="2" />
              <path d="M5 15V7a2 2 0 0 1 2-2h8" />
            </svg>
            Duplicate node
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Delete node
          </button>
        </section>
      </div>
    </aside>
  );
}
