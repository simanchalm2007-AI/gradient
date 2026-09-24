interface ActivityPoint {
  date: string;
  rating: number;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

export function DailyActivityChart({ points }: { points: ActivityPoint[] }) {
  const chartWidth = 640;
  const chartHeight = 180;
  const left = 38;
  const right = 12;
  const top = 12;
  const bottom = 30;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const x = (index: number) => left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (rating: number) => top + ((100 - Math.max(0, Math.min(100, Math.round(rating)))) / 100) * plotHeight;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.rating)}`).join(" ");

  return (
    <section id="daily-activity" className="mb-5 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Daily activity</h2>
          <p className="mt-1 text-xs text-muted">Completion rating for the last seven recorded days.</p>
        </div>
        <span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-semibold text-amber">0–100</span>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="flex h-[180px] flex-col justify-between pb-7 text-[11px] text-muted" aria-hidden="true">
          <span>100</span><span>50</span><span>0</span>
        </div>
        <div className="min-w-0 flex-1">
          <svg className="h-[180px] w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Daily activity rating from zero to one hundred">
            {[0, 50, 100].map((value) => <line key={value} x1={left} x2={chartWidth - right} y1={y(value)} y2={y(value)} className="chart-grid-line" />)}
            {points.length > 0 && <path d={path} className="chart-line" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {points.map((point, index) => <circle key={point.date} cx={x(index)} cy={y(point.rating)} r="4" className="chart-point"><title>{`${point.date}: ${point.rating}/100`}</title></circle>)}
          </svg>
          <div className="flex justify-between pl-2 pr-2 text-[11px] text-muted">{points.map((point) => <span key={point.date}>{formatDate(point.date)}</span>)}</div>
        </div>
      </div>
    </section>
  );
}
