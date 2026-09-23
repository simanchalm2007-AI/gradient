interface ProgressRingProps {
  percent: number;
}

export function ProgressRing({ percent }: ProgressRingProps) {
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
      <circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke="var(--color-amber)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dashoffset 0.3s ease" }}
      />
      <text x="60" y="67" textAnchor="middle" fontSize="22" fill="var(--color-ink)" fontFamily="var(--font-sans)">
        {percent}%
      </text>
    </svg>
  );
}
