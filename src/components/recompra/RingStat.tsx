type Props = {
  label: string;
  sublabel: string;
  percent: number;
  tone: "primary" | "urgent" | "chart-4";
};

const TONE: Record<Props["tone"], string> = {
  primary: "var(--primary)",
  urgent: "var(--urgent)",
  "chart-4": "var(--chart-4)",
};

export function RingStat({ label, sublabel, percent, tone }: Props) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * c;

  return (
    <div className="panel flex items-center gap-4 p-5">
      <div className="relative h-[104px] w-[104px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={TONE[tone]}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-2xl font-bold">{Math.round(percent)}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold leading-tight">{label}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}
