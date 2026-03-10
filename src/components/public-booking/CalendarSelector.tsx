"use client";

interface CalendarSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CalendarSelector({ value, onChange }: CalendarSelectorProps) {
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data</span>
      <input
        type="date"
        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none"
        value={value}
        min={minDate}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </label>
  );
}
