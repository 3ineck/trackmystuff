import type { Tag } from "../types";

interface Props {
  tags: Tag[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

export default function TagDropdown({ tags, value, onChange, disabled }: Props) {
  return (
    <div className="w-72">
      <label className="block text-xs uppercase tracking-wide text-muted">
        Activity
      </label>
      <select
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="mt-1 w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-60"
      >
        <option value="">Select a tag…</option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
