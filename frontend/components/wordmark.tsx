/*
  The mark is a single repeat of the Ajrakh block — the same resist diamond that
  rules the section dividers, cut down to badge size. Reusing the motif rather
  than dropping a generic icon into a gradient tile keeps one idea doing all the
  identity work.
*/
export function Wordmark({ tone = 'default' }: { tone?: 'default' | 'inverse' }) {
  const inverse = tone === 'inverse';

  return (
    <span className="inline-flex items-center gap-3">
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 shrink-0"
        aria-hidden="true"
        fill="none"
        strokeWidth="1.4"
        strokeLinejoin="round"
      >
        <rect
          x="0.7"
          y="0.7"
          width="22.6"
          height="22.6"
          rx="2"
          className={inverse ? 'stroke-primary-foreground/40' : 'stroke-primary/30'}
        />
        <path d="M12 3.6 20.4 12 12 20.4 3.6 12z" className="stroke-madder" />
        <path d="M12 8.2 15.8 12 12 15.8 8.2 12z" className="fill-madder stroke-madder" />
      </svg>
      <span className="leading-none">
        <span
          className={`display-sm block text-[1.35rem] tracking-tight ${
            inverse ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          Kalamitra
        </span>
        <span className={`eyebrow mt-1 block text-[0.5625rem] ${inverse ? 'text-primary-foreground/45' : ''}`}>
          Handmade in India
        </span>
      </span>
    </span>
  );
}
