import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StageData } from '@/types';
import { renderStageIcon, STAGE_ICON_OPTIONS } from '@/lib/stageIcons';

interface IconPickerFieldProps {
  value: string;
  category?: StageData['category'];
  accentColor: string;
  onChange: (value: string) => void;
}

interface PopoverStyle {
  top: number;
  left: number;
  width: number;
}

export function IconPickerField({
  value,
  category,
  accentColor,
  onChange,
}: IconPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [popoverStyle, setPopoverStyle] = useState<PopoverStyle | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return STAGE_ICON_OPTIONS.slice(0, 120);

    return STAGE_ICON_OPTIONS
      .filter((option) => option.searchText.includes(normalized))
      .slice(0, 120);
  }, [query]);

  const updatePopoverPosition = useCallback(() => {
    if (!rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const width = Math.min(304, Math.max(240, Math.floor(window.innerWidth * 0.85)));
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    const top = Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 8));

    setPopoverStyle({ top, left, width });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const inTrigger = !!(target && rootRef.current?.contains(target));
      const inPopover = !!(target && popoverRef.current?.contains(target));

      if (!inTrigger && !inPopover) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);

    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  const popover =
    isOpen && popoverStyle
      ? createPortal(
          <div
            ref={popoverRef}
            className="z-[9999] rounded-xl border border-neutral-300 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#0f1117]"
            style={{
              position: 'fixed',
              top: popoverStyle.top,
              left: popoverStyle.left,
              width: popoverStyle.width,
            }}
          >
            <div className="relative mb-2">
              <Search
                size={13}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/30"
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a Lucide icon..."
                className="w-full rounded-md border border-neutral-300 bg-white py-1.5 pl-7 pr-2 text-xs text-neutral-700 outline-none focus:border-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:focus:border-white/30"
              />
            </div>

            <div className="max-h-56 overflow-y-auto pr-1">
              {filteredOptions.length === 0 && (
                <p className="px-1 py-2 text-[11px] text-neutral-500 dark:text-white/40">No icon found</p>
              )}

              {filteredOptions.length > 0 && (
                <div className="grid grid-cols-6 gap-1">
                  {filteredOptions.map((option) => {
                    const selected = option.key === value;
                    const Icon = option.Icon;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        title={option.label}
                        onClick={() => {
                          onChange(option.key);
                          setIsOpen(false);
                        }}
                        className={`flex h-8 w-full items-center justify-center rounded-md border transition-colors ${
                          selected
                            ? 'border-neutral-400 bg-neutral-100 dark:border-white/30 dark:bg-white/10'
                            : 'border-neutral-300 bg-white/80 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-white/50 dark:hover:border-white/20 dark:hover:bg-white/10'
                        }`}
                        style={selected ? { color: accentColor } : undefined}
                      >
                        <Icon size={14} strokeWidth={2.1} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="mt-2 text-[10px] text-neutral-500 dark:text-white/35">
              Showing first {filteredOptions.length} results
            </p>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative z-20">
      <label className="mb-2 block text-[10px] uppercase tracking-wider text-neutral-500 dark:text-white/30">
        Icon
      </label>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white/80 dark:border-white/10 dark:bg-white/5"
          style={{ color: accentColor }}
        >
          {renderStageIcon(value, category, { size: 15, strokeWidth: 2.2 })}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => {
              const next = !prev;
              if (next) setQuery('');
              return next;
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
        >
          <Search size={13} />
          Search icon
        </button>
      </div>
      {popover}
    </div>
  );
}
