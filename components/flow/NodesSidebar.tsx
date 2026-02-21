'use client';

// components/flow/NodesSidebar.tsx
// Left panel — drag node templates onto the canvas

import { useState } from 'react';
import { NODE_TEMPLATES, NODE_CATEGORY_CONFIG, NodeCategory } from '@/types';

const ALL_CATEGORIES = Object.keys(NODE_CATEGORY_CONFIG) as NodeCategory[];

export function NodesSidebar() {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<NodeCategory>>(
    new Set(ALL_CATEGORIES)
  );

  const toggleCategory = (cat: NodeCategory) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const filtered = NODE_TEMPLATES.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const onDragStart = (e: React.DragEvent, templateIndex: number) => {
    e.dataTransfer.setData('application/reactflow-template', String(templateIndex));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="h-full w-60 select-none border-r border-neutral-300 bg-white/90 backdrop-blur-sm dark:border-white/5 dark:bg-[#0a0c12]">
      {/* Header */}
      <div className="border-b border-neutral-300 px-4 pb-3 pt-5 dark:border-white/5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-white/30">
          Nodes
        </h2>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/25"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search nodes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white/70 py-2 pl-8 pr-3 text-xs text-neutral-700 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/8 dark:bg-white/5 dark:text-white/70 dark:placeholder:text-white/20 dark:focus:border-white/20"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {ALL_CATEGORIES.map((cat) => {
          const catConfig = NODE_CATEGORY_CONFIG[cat];
          const items = filtered.filter((t) => t.category === cat);
          if (items.length === 0) return null;
          const isOpen = openCategories.has(cat);

          return (
            <div key={cat}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-white/5"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: catConfig.accent }}
                />
                <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-600 group-hover:text-neutral-800 dark:text-white/40 dark:group-hover:text-white/60">
                  {catConfig.label}
                </span>
                <span className="text-xs text-neutral-500 dark:text-white/20">{isOpen ? '−' : '+'}</span>
              </button>

              {/* Items */}
              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-2">
                  {items.map((template, i) => {
                    const globalIdx = NODE_TEMPLATES.indexOf(template);
                    return (
                      <div
                        key={i}
                        draggable
                        onDragStart={(e) => onDragStart(e, globalIdx)}
                        className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all active:cursor-grabbing hover:border-neutral-300 hover:bg-neutral-100 dark:hover:border-white/10 dark:hover:bg-white/5"
                      >
                        <span className="text-base leading-none">{template.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-neutral-700 group-hover:text-neutral-900 dark:text-white/70 dark:group-hover:text-white/90">
                            {template.label}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-neutral-500 dark:text-white/25">
                            {template.description}
                          </p>
                        </div>
                        {/* Drag hint */}
                        <svg
                          className="ml-auto flex-shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-600 dark:text-white/15 dark:group-hover:text-white/30"
                          width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                        >
                          <circle cx="9" cy="5" r="1.5" fill="currentColor" stroke="none"/>
                          <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                          <circle cx="9" cy="19" r="1.5" fill="currentColor" stroke="none"/>
                          <circle cx="15" cy="5" r="1.5" fill="currentColor" stroke="none"/>
                          <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                          <circle cx="15" cy="19" r="1.5" fill="currentColor" stroke="none"/>
                        </svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="pt-8 text-center text-xs text-neutral-500 dark:text-white/20">No nodes found</p>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-neutral-300 px-4 py-3 dark:border-white/5">
        <p className="text-center text-[10px] leading-relaxed text-neutral-500 dark:text-white/20">
          Drag a node onto the canvas to add it
        </p>
      </div>
    </aside>
  );
}
