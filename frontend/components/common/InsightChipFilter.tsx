"use client";

type InsightChipFilterProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function InsightChipFilter<T extends string>({
  options,
  value,
  onChange,
}: InsightChipFilterProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              selected
                ? "bg-seed-carrot-500 text-white"
                : "bg-seed-gray-100 text-seed-gray-700"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
