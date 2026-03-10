"use client";

interface CalendarSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CalendarSelector({ value, onChange }: CalendarSelectorProps) {
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <label className="grid gap-1 text-sm text-slate-700">
      Data
      <input
        type="date"
        className="rounded-md border border-slate-300 bg-white px-3 py-2"
        value={value}
        min={minDate}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </label>
  );
}
