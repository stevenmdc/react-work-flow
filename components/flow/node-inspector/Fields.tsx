import { KeyboardEvent, useState } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

interface BadgeListFieldProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function TextField({ label, value, onChange }: TextFieldProps) {
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

export function TextAreaField({ label, value, onChange, rows = 3 }: TextAreaFieldProps) {
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

export function ToggleField({ label, value, onChange }: ToggleFieldProps) {
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

export function BadgeListField({
  label,
  value,
  onChange,
  placeholder = 'Add a badge',
}: BadgeListFieldProps) {
  const [draft, setDraft] = useState('');

  const addBadge = (rawValue: string) => {
    const nextBadge = rawValue.trim();
    if (!nextBadge) return;

    const exists = value.some(
      (currentBadge) => currentBadge.toLocaleLowerCase() === nextBadge.toLocaleLowerCase()
    );
    if (exists) return;

    onChange([...value, nextBadge]);
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addBadge(draft);
  };

  const removeBadge = (badgeToRemove: string) => {
    onChange(value.filter((badge) => badge !== badgeToRemove));
  };

  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-neutral-500 dark:text-white/30">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-300 bg-white/80 px-3 py-2 text-xs text-neutral-700 outline-none transition-colors focus:border-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:focus:border-white/30"
        />
        <button
          type="button"
          onClick={() => addBadge(draft)}
          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
        >
          Add
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((badge) => (
            <button
              key={badge}
              type="button"
              onClick={() => removeBadge(badge)}
              title="Remove badge"
              className="rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 transition-colors hover:border-red-300 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-red-400/50 dark:hover:text-red-400"
            >
              {badge} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
