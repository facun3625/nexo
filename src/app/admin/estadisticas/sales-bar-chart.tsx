"use client";

export function SalesBarChart({
  data,
}: {
  data: { key: string; label: string; value: number; valueLabel: string }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos en este rango.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-40 items-end gap-[3px]">
        {data.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 flex-col items-center justify-end">
            <div
              className="w-full min-w-[2px] rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
              style={{ height: d.value > 0 ? `${Math.max(2, (d.value / max) * 100)}%` : "1px" }}
            />
            <div className="pointer-events-none absolute bottom-full mb-1.5 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background group-hover:block">
              {d.label}: {d.valueLabel}
            </div>
          </div>
        ))}
      </div>
      {data.length > 1 && (
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{data[0].label}</span>
          <span>{data[data.length - 1].label}</span>
        </div>
      )}
    </div>
  );
}
