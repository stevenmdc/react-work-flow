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
