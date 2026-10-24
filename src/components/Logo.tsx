export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d="M16 7 5 12.5 16 18l9-4.5V20h2v-7.5L16 7Zm-6.5 9.3V21c0 1.9 2.9 4 6.5 4s6.5-2.1 6.5-4v-4.7L16 19.6l-6.5-3.3Z" className="fill-accent-fg" />
    </svg>
  );
}
