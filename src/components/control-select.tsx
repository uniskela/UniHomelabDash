"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export function ControlSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  disabled,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-xs text-muted-foreground", className)}>
      <span className="font-medium text-foreground">{label}</span>
      <NativeSelect
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
