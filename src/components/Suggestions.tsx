interface SuggestionsProps {
  tips: string[];
}

export function Suggestions({ tips }: SuggestionsProps) {
  if (tips.length === 0) {
    return (
      <div className="flex gap-2.5 py-3 text-sm leading-relaxed">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal" />
        <span>Your schedule looks well balanced right now — nothing urgent to change.</span>
      </div>
    );
  }

  return (
    <div>
      {tips.map((tip) => (
        <div key={tip} className="flex gap-2.5 border-b border-line py-3 text-sm leading-relaxed last:border-none">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-flag" />
          <span>{tip}</span>
        </div>
      ))}
    </div>
  );
}
